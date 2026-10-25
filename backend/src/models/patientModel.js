const {
  dbRun,
  dbGet,
  dbAll,
} = require('../middlewares_helpers/sqlite3_helpers');

// Mengambil semua data pasien
const findAllPatients = async () => {
  return dbAll(
    'SELECT * FROM patients ORDER BY id DESC'
  );
};

// Mengambil pasien berdasarkan ID
const findPatientById = async (id) => {
  return dbGet(
    'SELECT * FROM patients WHERE id = ?',
    [id]
  );
};

// Menambahkan pasien baru
const createPatient = async (body) => {
  const query = `
    INSERT INTO patients (
      full_name,
      phone,
      email,
      date_of_birth,
      gender,
      address
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    body.full_name,
    body.phone,
    body.email ?? null,
    body.date_of_birth ?? null,
    body.gender ?? null,
    body.address ?? null,
  ];

  const result = await dbRun(query, values);

  return findPatientById(result.lastID);
};

// Memperbarui data pasien
const updatePatient = async (id, body) => {
  const existing = await findPatientById(id);

  if (!existing) {
    return null;
  }

  const query = `
    UPDATE patients
    SET full_name = ?,
        phone = ?,
        email = ?,
        date_of_birth = ?,
        gender = ?,
        address = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const values = [
    body.full_name !== undefined
      ? body.full_name
      : existing.full_name,

    body.phone !== undefined
      ? body.phone
      : existing.phone,

    body.email !== undefined
      ? body.email
      : existing.email,

    body.date_of_birth !== undefined
      ? body.date_of_birth
      : existing.date_of_birth,

    body.gender !== undefined
      ? body.gender
      : existing.gender,

    body.address !== undefined
      ? body.address
      : existing.address,

    id,
  ];

  await dbRun(query, values);

  return findPatientById(id);
};

// Menghapus pasien
const deletePatient = async (id) => {
  const result = await dbRun(
    'DELETE FROM patients WHERE id = ?',
    [id]
  );

  return result.changes > 0;
};

module.exports = {
  findAllPatients,
  findPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};