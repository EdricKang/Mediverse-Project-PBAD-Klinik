const {
  dbRun,
  dbGet,
  dbAll,
} = require('../middlewares_helpers/sqlite3_helpers');

// Mengambil daftar jadwal praktik.
const findAllSchedules = async (filters = {}) => {
  let query = `
    SELECT
      s.*,
      d.title_prefix,
      d.full_name AS doctor_name,
      d.title_suffix,
      d.specialization AS doctor_specialization
    FROM doctor_schedules s
    JOIN doctors d ON d.id = s.doctor_id
    LEFT JOIN rooms r ON r.id = d.room_id
  `;

  const conditions = [];
  const values = [];

  if (filters.doctor_id !== undefined) {
    conditions.push('s.doctor_id = ?');
    values.push(filters.doctor_id);
  }

  if (filters.day_of_week !== undefined) {
    conditions.push('s.day_of_week = ?');
    values.push(filters.day_of_week);
  }

  if (filters.is_active !== undefined) {
    conditions.push('s.is_active = ?');
    values.push(filters.is_active);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += `
    ORDER BY s.doctor_id, s.day_of_week, s.start_time
  `;

  return dbAll(query, values);
};

// Mengambil satu jadwal berdasarkan ID.
const findScheduleById = async (id) => {
  const query = `
    SELECT
      s.*,
      d.title_prefix,
      d.full_name AS doctor_name,
      d.title_suffix,
      d.specialization AS doctor_specialization
    FROM doctor_schedules s
    JOIN doctors d ON d.id = s.doctor_id
    WHERE s.id = ?
  `;

  return dbGet(query, [id]);
};

// Memeriksa apakah jadwal bertabrakan dengan jadwal aktif lain.
const findOverlappingSchedule = async ({
  doctor_id,
  day_of_week,
  start_time,
  end_time,
  exclude_id = 0,
}) => {
  const query = `
    SELECT id
    FROM doctor_schedules
    WHERE doctor_id = ?
      AND day_of_week = ?
      AND is_active = 1
      AND start_time < ?
      AND end_time > ?
      AND id <> ?
    LIMIT 1
  `;

  return dbGet(query, [
    doctor_id,
    day_of_week,
    end_time,
    start_time,
    exclude_id,
  ]);
};

// Menambahkan jadwal praktik.
const createSchedule = async (schedule) => {
  const query = `
    INSERT INTO doctor_schedules (
      doctor_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration_minutes,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    schedule.doctor_id,
    schedule.day_of_week,
    schedule.start_time,
    schedule.end_time,
    schedule.slot_duration_minutes,
    schedule.is_active,
  ];

  const result = await dbRun(query, values);

  return findScheduleById(result.lastID);
};

// Memperbarui data jadwal.
const updateSchedule = async (id, schedule) => {
  const query = `
    UPDATE doctor_schedules
    SET doctor_id = ?,
        day_of_week = ?,
        start_time = ?,
        end_time = ?,
        slot_duration_minutes = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const values = [
    schedule.doctor_id,
    schedule.day_of_week,
    schedule.start_time,
    schedule.end_time,
    schedule.slot_duration_minutes,
    schedule.is_active,
    id,
  ];

  const result = await dbRun(query, values);

  if (result.changes === 0) {
    return null;
  }

  return findScheduleById(id);
};

// Mengaktifkan atau menonaktifkan jadwal.
const updateScheduleStatus = async (id, isActive) => {
  const query = `
    UPDATE doctor_schedules
    SET is_active = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const result = await dbRun(query, [isActive, id]);

  if (result.changes === 0) {
    return null;
  }

  return findScheduleById(id);
};

module.exports = {
  findAllSchedules,
  findScheduleById,
  findOverlappingSchedule,
  createSchedule,
  updateSchedule,
  updateScheduleStatus,
};