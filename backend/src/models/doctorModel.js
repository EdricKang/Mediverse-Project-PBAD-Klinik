const {
  dbRun,
  dbGet,
  dbAll,
} = require('../middlewares_helpers/sqlite3_helpers');

// Mengambil semua dokter.
// room_number sekarang langsung berasal dari tabel doctors.
const findAllDoctors = async () => {
  const query = `
    SELECT *
    FROM doctors
    ORDER BY id DESC
  `;

  return dbAll(query);
};

// Mengambil satu dokter berdasarkan ID.
const findDoctorById = async (id) => {
  const query = `
    SELECT *
    FROM doctors
    WHERE id = ?
  `;

  return dbGet(query, [id]);
};

// Menambahkan dokter beserta nomor ruangannya.
const createDoctor = async (body) => {
  const query = `
    INSERT INTO doctors (
      title_prefix,
      full_name,
      title_suffix,
      specialization,
      room_number,
      phone,
      email,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const values = [
    body.title_prefix ?? null,
    body.full_name,
    body.title_suffix ?? null,
    body.specialization,
    body.room_number,
    body.phone ?? null,
    body.email ?? null,
  ];

  const result = await dbRun(query, values);

  return findDoctorById(result.lastID);
};

// Memperbarui data dokter.
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
        room_number = ?,
        phone = ?,
        email = ?,
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

    body.room_number !== undefined
      ? body.room_number
      : existing.room_number,

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

// Mengubah status aktif dokter.
const updateDoctorStatus = async (id, isActive) => {
  const query = `
    UPDATE doctors
    SET is_active = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const result = await dbRun(query, [
    isActive ? 1 : 0,
    id,
  ]);

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