const { randomBytes } = require('crypto');

const {
  dbRun,
  dbGet,
  dbAll,
} = require('../middlewares_helpers/sqlite3_helpers');

const findAllAppointments = async (filters = {}) => {
  let query = `
    SELECT
      a.id,
      a.patient_id,
      a.doctor_id,
      a.booking_code,
      a.appointment_date,
      a.appointment_time,
      a.complaint,
      a.status,
      a.created_at,
      a.updated_at,
      p.full_name AS patient_name,
      p.phone AS patient_phone,
      d.title_prefix,
      d.full_name AS doctor_name,
      d.title_suffix,
      d.specialization AS doctor_specialization,
      d.room_number
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
  `;

  const conditions = [];
  const values = [];

  if (filters.date) {
    conditions.push('a.appointment_date = ?');
    values.push(filters.date);
  }

  if (filters.patient_id !== undefined) {
    conditions.push('a.patient_id = ?');
    values.push(filters.patient_id);
  }

  if (filters.doctor_id !== undefined) {
    conditions.push('a.doctor_id = ?');
    values.push(filters.doctor_id);
  }

  if (filters.status) {
    conditions.push('a.status = ?');
    values.push(filters.status);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += `
    ORDER BY
      a.appointment_date ASC,
      a.appointment_time ASC
  `;

  return dbAll(query, values);
};

const findAppointmentById = async (id) => {
  const query = `
    SELECT
      a.id,
      a.patient_id,
      a.doctor_id,
      a.booking_code,
      a.appointment_date,
      a.appointment_time,
      a.complaint,
      a.status,
      a.created_at,
      a.updated_at,
      p.full_name AS patient_name,
      p.phone AS patient_phone,
      d.title_prefix,
      d.full_name AS doctor_name,
      d.title_suffix,
      d.specialization AS doctor_specialization,
      d.room_number
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = ?
  `;

  return dbGet(query, [id]);
};

const createAppointment = async (body) => {
  const query = `
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      booking_code,
      appointment_date,
      appointment_time,
      complaint,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

  for (let attempt = 0; attempt < 5; attempt++) {
    const bookingCode =
      `KLINIK-${randomBytes(5).toString('hex').toUpperCase()}`;

    const values = [
      body.patient_id,
      body.doctor_id,
      bookingCode,
      body.appointment_date,
      body.appointment_time,
      body.complaint ?? null,
    ];

    try {
      const result = await dbRun(query, values);

      return findAppointmentById(result.lastID);
    } catch (error) {
      if (
        error.message?.includes('appointments.booking_code') &&
        attempt < 4
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Gagal membuat kode booking yang unik');
};

const updateAppointment = async (id, body) => {
  const query = `
    UPDATE appointments
    SET patient_id = ?,
        doctor_id = ?,
        appointment_date = ?,
        appointment_time = ?,
        complaint = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const values = [
    body.patient_id,
    body.doctor_id,
    body.appointment_date,
    body.appointment_time,
    body.complaint ?? null,
    id,
  ];

  const result = await dbRun(query, values);

  if (result.changes === 0) {
    return null;
  }

  return findAppointmentById(id);
};

const updateAppointmentStatus = async (id, status) => {
  const query = `
    UPDATE appointments
    SET status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const result = await dbRun(query, [status, id]);

  if (result.changes === 0) {
    return null;
  }

  return findAppointmentById(id);
};

const findBookedAppointmentTimes = async (
  doctorId,
  appointmentDate
) => {
  const query = `
    SELECT appointment_time
    FROM appointments
    WHERE doctor_id = ?
      AND appointment_date = ?
      AND status IN ('pending', 'confirmed')
    ORDER BY appointment_time ASC
  `;

  return dbAll(query, [doctorId, appointmentDate]);
};

module.exports = {
  findAllAppointments,
  findAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  findBookedAppointmentTimes,
};