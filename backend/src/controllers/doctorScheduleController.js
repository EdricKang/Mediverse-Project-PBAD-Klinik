const doctorScheduleModel = require('../models/doctorScheduleModel');
const doctorModel = require('../models/doctorModel');

const success = (res, status, message, data = null) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const fail = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

const parseId = (value) => {
  if (!/^[1-9]\d*$/.test(String(value))) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
};

const parseDay = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const day = Number(value);

  return Number.isInteger(day) && day >= 1 && day <= 7
    ? day
    : null;
};

const parseActive = (value) => {
  if ([true, 1, '1'].includes(value)) return 1;
  if ([false, 0, '0'].includes(value)) return 0;

  return null;
};

const validTime = (value) => {
  return (
    typeof value === 'string' &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const validateSchedule = (schedule) => {
  if (!validTime(schedule.start_time)) {
    return 'Jam mulai harus menggunakan format HH:MM';
  }

  if (!validTime(schedule.end_time)) {
    return 'Jam selesai harus menggunakan format HH:MM';
  }

  if (schedule.start_time >= schedule.end_time) {
    return 'Jam selesai harus setelah jam mulai';
  }

  if (
    !Number.isInteger(schedule.slot_duration_minutes) ||
    schedule.slot_duration_minutes <= 0
  ) {
    return 'Durasi slot harus berupa angka bulat lebih dari 0';
  }

  const duration =
    timeToMinutes(schedule.end_time) -
    timeToMinutes(schedule.start_time);

  if (schedule.slot_duration_minutes > duration) {
    return 'Durasi slot tidak boleh lebih panjang dari jam praktik';
  }

  return null;
};

// GET /api/doctor-schedules
const getAllSchedules = async (req, res) => {
  const filters = {};

  if (req.query.doctor_id !== undefined) {
    const doctorId = parseId(req.query.doctor_id);

    if (!doctorId) {
      return fail(res, 400, 'ID dokter tidak valid');
    }

    filters.doctor_id = doctorId;
  }

  if (req.query.day_of_week !== undefined) {
    const day = parseDay(req.query.day_of_week);

    if (day === null) {
      return fail(
        res,
        400,
        'Hari harus berupa angka 1 sampai 7'
      );
    }

    filters.day_of_week = day;
  }

  if (req.query.is_active !== undefined) {
    const active = parseActive(req.query.is_active);

    if (active === null) {
      return fail(
        res,
        400,
        'is_active harus berupa 1 atau 0'
      );
    }

    filters.is_active = active;
  }

  try {
    const schedules =
      await doctorScheduleModel.findAllSchedules(filters);

    return success(
      res,
      200,
      'Berhasil mengambil jadwal praktik',
      schedules
    );
  } catch (error) {
    console.error('[getAllSchedules]', error);

    return fail(res, 500, 'Gagal mengambil jadwal praktik');
  }
};

// GET /api/doctor-schedules/:id
const getScheduleById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID jadwal tidak valid');
  }

  try {
    const schedule =
      await doctorScheduleModel.findScheduleById(id);

    if (!schedule) {
      return fail(res, 404, 'Jadwal praktik tidak ditemukan');
    }

    return success(
      res,
      200,
      'Berhasil mengambil jadwal praktik',
      schedule
    );
  } catch (error) {
    console.error('[getScheduleById]', error);

    return fail(res, 500, 'Gagal mengambil jadwal praktik');
  }
};

// POST /api/doctor-schedules
const createSchedule = async (req, res) => {
  const body = req.body ?? {};

  const doctorId = parseId(body.doctor_id);
  const day = parseDay(body.day_of_week);

  const duration =
    body.slot_duration_minutes === undefined
      ? 30
      : Number(body.slot_duration_minutes);

  const active =
    body.is_active === undefined
      ? 1
      : parseActive(body.is_active);

  if (!doctorId) {
    return fail(res, 400, 'ID dokter wajib diisi dan harus valid');
  }

  if (day === null) {
    return fail(
      res,
      400,
      'Hari praktik harus berupa angka 0 sampai 6'
    );
  }

  if (active === null) {
    return fail(res, 400, 'is_active harus berupa 1 atau 0');
  }

  const schedule = {
    doctor_id: doctorId,
    day_of_week: day,
    start_time: body.start_time,
    end_time: body.end_time,
    slot_duration_minutes: duration,
    is_active: active,
  };

  const validationError = validateSchedule(schedule);

  if (validationError) {
    return fail(res, 400, validationError);
  }

  try {
    const doctor = await doctorModel.findDoctorById(doctorId);

    if (!doctor) {
      return fail(res, 404, 'Dokter tidak ditemukan');
    }

    if (active === 1) {
      const overlapping =
        await doctorScheduleModel.findOverlappingSchedule(
          schedule
        );

      if (overlapping) {
        return fail(
          res,
          409,
          'Jadwal bertabrakan dengan jadwal aktif dokter yang lain'
        );
      }
    }

    const created =
      await doctorScheduleModel.createSchedule(schedule);

    return success(
      res,
      201,
      'Jadwal praktik berhasil ditambahkan',
      created
    );
  } catch (error) {
    console.error('[createSchedule]', error);

    if (error.message?.includes('UNIQUE constraint failed')) {
      return fail(
        res,
        409,
        'Jadwal dengan hari dan jam mulai tersebut sudah ada'
      );
    }

    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      return fail(res, 400, 'ID dokter tidak valid');
    }

    return fail(res, 500, 'Gagal menambahkan jadwal praktik');
  }
};

// PUT /api/doctor-schedules/:id
const updateSchedule = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID jadwal tidak valid');
  }

  try {
    const existing =
      await doctorScheduleModel.findScheduleById(id);

    if (!existing) {
      return fail(res, 404, 'Jadwal praktik tidak ditemukan');
    }

    const body = req.body ?? {};

    const doctorId = parseId(
      body.doctor_id ?? existing.doctor_id
    );

    const day = parseDay(
      body.day_of_week ?? existing.day_of_week
    );

    const duration =
      body.slot_duration_minutes === undefined
        ? existing.slot_duration_minutes
        : Number(body.slot_duration_minutes);

    const active =
      body.is_active === undefined
        ? Number(existing.is_active)
        : parseActive(body.is_active);

    if (!doctorId) {
      return fail(res, 400, 'ID dokter tidak valid');
    }

    if (day === null) {
      return fail(res, 400, 'Hari praktik tidak valid');
    }

    if (active === null) {
      return fail(res, 400, 'is_active harus berupa 1 atau 0');
    }

    const schedule = {
      doctor_id: doctorId,
      day_of_week: day,
      start_time: body.start_time ?? existing.start_time,
      end_time: body.end_time ?? existing.end_time,
      slot_duration_minutes: duration,
      is_active: active,
    };

    const validationError = validateSchedule(schedule);

    if (validationError) {
      return fail(res, 400, validationError);
    }

    const doctor = await doctorModel.findDoctorById(doctorId);

    if (!doctor) {
      return fail(res, 404, 'Dokter tidak ditemukan');
    }

    if (active === 1) {
      const overlapping =
        await doctorScheduleModel.findOverlappingSchedule({
          ...schedule,
          exclude_id: id,
        });

      if (overlapping) {
        return fail(
          res,
          409,
          'Jadwal bertabrakan dengan jadwal aktif dokter yang lain'
        );
      }
    }

    const updated =
      await doctorScheduleModel.updateSchedule(id, schedule);

    return success(
      res,
      200,
      'Jadwal praktik berhasil diperbarui',
      updated
    );
  } catch (error) {
    console.error('[updateSchedule]', error);

    if (error.message?.includes('UNIQUE constraint failed')) {
      return fail(
        res,
        409,
        'Jadwal dengan hari dan jam mulai tersebut sudah ada'
      );
    }

    return fail(res, 500, 'Gagal memperbarui jadwal praktik');
  }
};

// PATCH /api/doctor-schedules/:id/status
const updateScheduleStatus = async (req, res) => {
  const id = parseId(req.params.id);
  const active = parseActive(req.body?.is_active);

  if (!id) {
    return fail(res, 400, 'ID jadwal tidak valid');
  }

  if (active === null) {
    return fail(res, 400, 'is_active harus berupa 1 atau 0');
  }

  try {
    const schedule =
      await doctorScheduleModel.findScheduleById(id);

    if (!schedule) {
      return fail(res, 404, 'Jadwal praktik tidak ditemukan');
    }

    if (active === 1) {
      const overlapping =
        await doctorScheduleModel.findOverlappingSchedule({
          doctor_id: schedule.doctor_id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          exclude_id: id,
        });

      if (overlapping) {
        return fail(
          res,
          409,
          'Jadwal tidak bisa diaktifkan karena bertabrakan dengan jadwal lain'
        );
      }
    }

    const updated =
      await doctorScheduleModel.updateScheduleStatus(id, active);

    return success(
      res,
      200,
      active === 1
        ? 'Jadwal praktik berhasil diaktifkan'
        : 'Jadwal praktik berhasil dinonaktifkan',
      updated
    );
  } catch (error) {
    console.error('[updateScheduleStatus]', error);

    return fail(res, 500, 'Gagal memperbarui status jadwal');
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  updateScheduleStatus,
};