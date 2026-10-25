const appointmentModel = require('../models/appointmentModel');
const patientModel = require('../models/patientModel');
const doctorModel = require('../models/doctorModel');
const doctorScheduleModel = require('../models/doctorScheduleModel');

const success = (res, status, message, data = null) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const fail = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
};

const parseId = (value) => {
  if (!/^[1-9]\d*$/.test(String(value))) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
};

const validDate = (value) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const validTime = (value) => {
  return (
    typeof value === 'string' &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
};

const validStatus = (value) => {
  return [
    'pending',
    'confirmed',
    'completed',
    'cancelled',
  ].includes(value);
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const getLocalDate = () => {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
};

const getAllAppointments = async (req, res) => {
  const filters = {};

  if (req.query.date !== undefined) {
    if (!validDate(req.query.date)) {
      return fail(
        res,
        400,
        'Format tanggal harus YYYY-MM-DD'
      );
    }

    filters.date = req.query.date;
  }

  for (const field of ['patient_id', 'doctor_id']) {
    if (req.query[field] !== undefined) {
      const id = parseId(req.query[field]);

      if (!id) {
        return fail(res, 400, `${field} tidak valid`);
      }

      filters[field] = id;
    }
  }

  if (req.query.status !== undefined) {
    if (!validStatus(req.query.status)) {
      return fail(res, 400, 'Status appointment tidak valid');
    }

    filters.status = req.query.status;
  }

  try {
    const appointments =
      await appointmentModel.findAllAppointments(filters);

    return success(
      res,
      200,
      'Berhasil mengambil daftar appointment',
      appointments
    );
  } catch (error) {
    console.error('[getAllAppointments]', error);

    return fail(res, 500, 'Terjadi kesalahan pada server');
  }
};

const getAppointmentById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID appointment tidak valid');
  }

  try {
    const appointment =
      await appointmentModel.findAppointmentById(id);

    if (!appointment) {
      return fail(res, 404, 'Appointment tidak ditemukan');
    }

    return success(
      res,
      200,
      'Berhasil mengambil detail appointment',
      appointment
    );
  } catch (error) {
    console.error('[getAppointmentById]', error);

    return fail(res, 500, 'Terjadi kesalahan pada server');
  }
};

const createAppointment = async (req, res) => {
  const body = req.body ?? {};

  const patientId = parseId(body.patient_id);
  const doctorId = parseId(body.doctor_id);

  if (!patientId || !doctorId) {
    return fail(
      res,
      400,
      'patient_id dan doctor_id wajib berupa ID positif'
    );
  }

  if (!validDate(body.appointment_date)) {
    return fail(
      res,
      400,
      'Tanggal harus valid dan berformat YYYY-MM-DD'
    );
  }

  if (!validTime(body.appointment_time)) {
    return fail(
      res,
      400,
      'Waktu harus berformat HH:MM, misalnya 10:00'
    );
  }

  const today = getLocalDate();

  if (body.appointment_date < today) {
    return fail(
      res,
      400,
      'Tanggal appointment tidak boleh di masa lalu'
    );
  }

  if (
    body.complaint !== undefined &&
    body.complaint !== null &&
    typeof body.complaint !== 'string'
  ) {
    return fail(
      res,
      400,
      'complaint harus berupa teks'
    );
  }

  try {
    const patient =
      await patientModel.findPatientById(patientId);

    if (!patient) {
      return fail(res, 404, 'Pasien tidak ditemukan');
    }

    const doctor =
      await doctorModel.findDoctorById(doctorId);

    if (!doctor) {
      return fail(res, 404, 'Dokter tidak ditemukan');
    }

    if (Number(doctor.is_active) !== 1) {
      return fail(
        res,
        400,
        'Dokter sedang tidak aktif dan tidak dapat menerima appointment'
      );
    }

    const now = new Date();

    const currentTime = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
    ].join(':');

    if (
      body.appointment_date === today &&
      body.appointment_time <= currentTime
    ) {
      return fail(
        res,
        400,
        'Jam appointment harus berada di waktu mendatang'
      );
    }

    const [year, month, day] =
      body.appointment_date.split('-').map(Number);

    const javascriptDay = new Date(
      Date.UTC(year, month - 1, day)
    ).getUTCDay();

    const dayOfWeek = javascriptDay === 0 ? 7 : javascriptDay;

    const schedules =
      await doctorScheduleModel.findAllSchedules({
        doctor_id: doctorId,
        day_of_week: dayOfWeek,
        is_active: 1,
      });

    const appointmentMinutes =
      timeToMinutes(body.appointment_time);

    const matchingSchedule = schedules.find((schedule) => {
      const startMinutes =
        timeToMinutes(schedule.start_time);

      const endMinutes =
        timeToMinutes(schedule.end_time);

      const slotDuration =
        Number(schedule.slot_duration_minutes);

      return (
        appointmentMinutes >= startMinutes &&
        appointmentMinutes < endMinutes &&
        appointmentMinutes + slotDuration <= endMinutes &&
        (appointmentMinutes - startMinutes) % slotDuration === 0
      );
    });

    if (!matchingSchedule) {
      return fail(
        res,
        400,
        'Waktu appointment tidak sesuai jadwal praktik dokter atau bukan awal slot yang tersedia'
      );
    }

    const appointment =
      await appointmentModel.createAppointment({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: body.appointment_date,
        appointment_time: body.appointment_time,
        complaint:
          typeof body.complaint === 'string'
            ? body.complaint.trim() || null
            : null,
      });

    return success(
      res,
      201,
      'Appointment berhasil dibuat',
      appointment
    );
  } catch (error) {
    console.error('[createAppointment]', error);

    if (
      error.message?.includes('UNIQUE constraint failed')
    ) {
      return fail(
        res,
        409,
        'Jadwal tersebut sudah terisi. Silakan pilih waktu lain.'
      );
    }

    if (
      error.message?.includes('FOREIGN KEY constraint failed')
    ) {
      return fail(
        res,
        400,
        'Pasien atau dokter tidak valid'
      );
    }

    return fail(
      res,
      500,
      'Terjadi kesalahan saat membuat appointment'
    );
  }
};

const updateAppointment = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID appointment tidak valid');
  }

  const body = req.body ?? {};

  const patientId = parseId(body.patient_id);
  const doctorId = parseId(body.doctor_id);

  if (!patientId || !doctorId) {
    return fail(
      res,
      400,
      'patient_id dan doctor_id wajib diisi dengan ID yang valid'
    );
  }

  if (!validDate(body.appointment_date)) {
    return fail(res, 400, 'Tanggal harus berformat YYYY-MM-DD');
  }

  if (!validTime(body.appointment_time)) {
    return fail(res, 400, 'Waktu harus berformat HH:MM');
  }

  if (
    body.complaint !== undefined &&
    body.complaint !== null &&
    typeof body.complaint !== 'string'
  ) {
    return fail(res, 400, 'complaint harus berupa teks');
  }

  const today = getLocalDate();

  if (body.appointment_date < today) {
    return fail(res, 400, 'Tanggal appointment tidak boleh lewat');
  }

  const now = new Date();
  const currentTime = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join(':');

  if (
    body.appointment_date === today &&
    body.appointment_time <= currentTime
  ) {
    return fail(res, 400, 'Waktu appointment harus di masa mendatang');
  }

  try {
    const existing =
      await appointmentModel.findAppointmentById(id);

    if (!existing) {
      return fail(res, 404, 'Appointment tidak ditemukan');
    }

    if (!['pending', 'confirmed'].includes(existing.status)) {
      return fail(
        res,
        400,
        'Appointment yang sudah selesai atau dibatalkan tidak dapat diubah'
      );
    }

    const patient =
      await patientModel.findPatientById(patientId);

    if (!patient) {
      return fail(res, 404, 'Pasien tidak ditemukan');
    }

    const doctor =
      await doctorModel.findDoctorById(doctorId);

    if (!doctor) {
      return fail(res, 404, 'Dokter tidak ditemukan');
    }

    if (Number(doctor.is_active) !== 1) {
      return fail(res, 400, 'Dokter sedang tidak aktif');
    }

    const [year, month, day] =
      body.appointment_date.split('-').map(Number);

    const javascriptDay = new Date(
      Date.UTC(year, month - 1, day)
    ).getUTCDay();

    const dayOfWeek = javascriptDay === 0 ? 7 : javascriptDay;

    const schedules =
      await doctorScheduleModel.findAllSchedules({
        doctor_id: doctorId,
        day_of_week: dayOfWeek,
        is_active: 1,
      });

    const appointmentMinutes =
      timeToMinutes(body.appointment_time);

    const matchingSchedule = schedules.find((schedule) => {
      const start = timeToMinutes(schedule.start_time);
      const end = timeToMinutes(schedule.end_time);
      const duration = Number(schedule.slot_duration_minutes);

      return (
        appointmentMinutes >= start &&
        appointmentMinutes < end &&
        appointmentMinutes + duration <= end &&
        (appointmentMinutes - start) % duration === 0
      );
    });

    if (!matchingSchedule) {
      return fail(
        res,
        400,
        'Waktu baru tidak sesuai jadwal praktik atau bukan awal slot'
      );
    }

    const appointment =
      await appointmentModel.updateAppointment(id, {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: body.appointment_date,
        appointment_time: body.appointment_time,
        complaint:
          typeof body.complaint === 'string'
            ? body.complaint.trim() || null
            : null,
      });

    return success(
      res,
      200,
      'Appointment berhasil diperbarui',
      appointment
    );
  } catch (error) {
    console.error('[updateAppointment]', error);

    if (error.message?.includes('UNIQUE constraint failed')) {
      return fail(
        res,
        409,
        'Slot tersebut sudah dipesan. Silakan pilih waktu lain.'
      );
    }

    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return fail(res, 400, 'Pasien atau dokter tidak valid');
    }

    return fail(res, 500, 'Gagal memperbarui appointment');
  }
};

const updateAppointmentStatus = async (req, res) => {
  const id = parseId(req.params.id);
  const { status } = req.body ?? {};

  if (!id) {
    return fail(res, 400, 'ID appointment tidak valid');
  }

  if (!validStatus(status)) {
    return fail(res, 400, 'Status appointment tidak valid');
  }

  try {
    const existing =
      await appointmentModel.findAppointmentById(id);

    if (!existing) {
      return fail(res, 404, 'Appointment tidak ditemukan');
    }

    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[existing.status].includes(status)) {
      return fail(
        res,
        400,
        `Status tidak dapat diubah dari ${existing.status} menjadi ${status}`
      );
    }

    const appointment =
      await appointmentModel.updateAppointmentStatus(id, status);

    return success(
      res,
      200,
      'Status appointment berhasil diperbarui',
      appointment
    );
  } catch (error) {
    console.error('[updateAppointmentStatus]', error);

    return fail(
      res,
      500,
      'Gagal memperbarui status appointment'
    );
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
};