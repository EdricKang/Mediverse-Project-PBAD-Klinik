const {
  dbRun,
  dbGet,
  dbAll,
} = require('../middlewares_helpers/sqlite3_helpers');

const findAllDoctors = async () => {
  const query = `
    SELECT d.*, r.room_number
    FROM doctors d
    LEFT JOIN rooms r ON r.id = d.room_id
    ORDER BY d.id DESC
  `;

  return dbAll(query);
};

const findDoctorById = async (id) => {
  const query = `
    SELECT d.*, r.room_number
    FROM doctors d
    LEFT JOIN rooms r ON r.id = d.room_id
    WHERE d.id = ?
  `;

  return dbGet(query, [id]);
};

const createDoctor = async (body) => {
  const query = `
    INSERT INTO doctors (
      title_prefix,
      full_name,
      title_suffix,
      specialization,
      phone,
      email,
      room_id,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const values = [
    body.title_prefix ?? null,
    body.full_name,
    body.title_suffix ?? null,
    body.specialization,
    body.phone ?? null,
    body.email ?? null,
    body.room_id,
  ];

  const result = await dbRun(query, values);

  return findDoctorById(result.lastID);
};

const updateDoctor = async (id, body) => {
  const existing = await findDoctorById(id);

  if (!existing) {
    return null;
  }

  const query = `
    UPDATE doctors
    SET title_prefix = ?,
        full_name = ?,
        title_suffix = ?,
        specialization = ?,
        phone = ?,
        email = ?,
        room_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const values = [
    body.title_prefix !== undefined
      ? body.title_prefix
      : existing.title_prefix,

    body.full_name !== undefined
      ? body.full_name
      : existing.full_name,

    body.title_suffix !== undefined
      ? body.title_suffix
      : existing.title_suffix,

    body.specialization !== undefined
      ? body.specialization
      : existing.specialization,

    body.phone !== undefined
      ? body.phone
      : existing.phone,

    body.email !== undefined
      ? body.email
      : existing.email,

    body.room_id !== undefined
      ? body.room_id
      : existing.room_id,

    id,
  ];

  await dbRun(query, values);

  return findDoctorById(id);
};

const updateDoctorStatus = async (id, isActive) => {
  const query = `
    UPDATE doctors
    SET is_active = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const result = await dbRun(
    query,
    [isActive ? 1 : 0, id]
  );

  if (result.changes === 0) {
    return null;
  }

  return findDoctorById(id);
};

module.exports = {
  findAllDoctors,
  findDoctorById,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
};