
const {
  dbRun,
  dbGet,
  dbAll,
} = require('../middlewares_helpers/sqlite3_helpers');

// Mengambil semua data dokter
const findAllDoctors = async () => {
  const query = `
    SELECT *
    FROM doctors
    ORDER BY id DESC
  `;

  return dbAll(query);
};

// Mengambil satu dokter berdasarkan ID
const findDoctorById = async (id) => {
  const query = `
    SELECT *
    FROM doctors
    WHERE id = ?
  `;

  return dbGet(query, [id]);
};

// Menambahkan dokter baru
const createDoctor = async (body) => {
  const query = `
    INSERT INTO doctors (
      full_name,
      specialization,
      phone,
      email,
      is_active
    )
    VALUES (?, ?, ?, ?, 1)
  `;

  const values = [
    body.full_name,
    body.specialization,
    body.phone ?? null,
    body.email ?? null,
  ];

  const result = await dbRun(query, values);

  return findDoctorById(result.lastID);
};

// Memperbarui data dokter
const updateDoctor = async (id, body) => {
  const existing = await findDoctorById(id);

  if (!existing) {
    return null;
  }

  const query = `
    UPDATE doctors
    SET full_name = ?,
        specialization = ?,
        phone = ?,
        email = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const values = [
    body.full_name !== undefined
      ? body.full_name
      : existing.full_name,

    body.specialization !== undefined
      ? body.specialization
      : existing.specialization,

    body.phone !== undefined
      ? body.phone
      : existing.phone,

    body.email !== undefined
      ? body.email
      : existing.email,

    id,
  ];

  await dbRun(query, values);

  return findDoctorById(id);
};

// Mengubah status aktif dokter
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
