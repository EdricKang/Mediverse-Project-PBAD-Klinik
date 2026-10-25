const patientModel = require('../models/patientModel');

const success = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const fail = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

const parseId = (rawId) => {
  if (!/^\d+$/.test(String(rawId))) {
    return null;
  }

  const id = Number(rawId);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

const getAllPatients = async (_req, res) => {
  try {
    const patients = await patientModel.findAllPatients();

    return success(
      res,
      200,
      'Berhasil mengambil semua pasien',
      patients
    );
  } catch (error) {
    console.error('[getAllPatients]', error);

    return fail(
      res,
      500,
      'Terjadi kesalahan pada server'
    );
  }
};

const getPatientById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID pasien tidak valid');
  }

  try {
    const patient = await patientModel.findPatientById(id);

    if (!patient) {
      return fail(res, 404, 'Pasien tidak ditemukan');
    }

    return success(
      res,
      200,
      'Berhasil mengambil data pasien',
      patient
    );
  } catch (error) {
    console.error('[getPatientById]', error);

    return fail(
      res,
      500,
      'Terjadi kesalahan pada server'
    );
  }
};

const createPatient = async (req, res) => {
  const body = req.body ?? {};

  const fullName =
    typeof body.full_name === 'string'
      ? body.full_name.trim()
      : '';

  const phone =
    typeof body.phone === 'string'
      ? body.phone.trim()
      : '';

  if (!fullName) {
    return fail(
      res,
      400,
      'Validasi gagal',
      'full_name wajib diisi'
    );
  }

  if (!phone) {
    return fail(
      res,
      400,
      'Validasi gagal',
      'phone wajib diisi'
    );
  }

  const optionalFields = [
    'email',
    'date_of_birth',
    'gender',
    'address',
  ];

  for (const field of optionalFields) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      typeof body[field] !== 'string'
    ) {
      return fail(
        res,
        400,
        'Validasi gagal',
        `${field} harus berupa teks`
      );
    }
  }

  try {
    const patient = await patientModel.createPatient({
      full_name: fullName,
      phone,
      email: body.email?.trim() || null,
      date_of_birth: body.date_of_birth?.trim() || null,
      gender: body.gender?.trim() || null,
      address: body.address?.trim() || null,
    });

    return success(
      res,
      201,
      'Pasien berhasil ditambahkan',
      patient
    );
  } catch (error) {
    console.error('[createPatient]', error);

    return fail(
      res,
      500,
      'Terjadi kesalahan saat menyimpan pasien'
    );
  }
};

const updatePatient = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID pasien tidak valid');
  }

  const body = req.body ?? {};

  if (
    body.full_name !== undefined &&
    (
      typeof body.full_name !== 'string' ||
      !body.full_name.trim()
    )
  ) {
    return fail(
      res,
      400,
      'Validasi gagal',
      'full_name tidak boleh kosong'
    );
  }

  if (
    body.phone !== undefined &&
    (
      typeof body.phone !== 'string' ||
      !body.phone.trim()
    )
  ) {
    return fail(
      res,
      400,
      'Validasi gagal',
      'phone tidak boleh kosong'
    );
  }

  for (const field of [
    'email',
    'date_of_birth',
    'gender',
    'address',
  ]) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      typeof body[field] !== 'string'
    ) {
      return fail(
        res,
        400,
        'Validasi gagal',
        `${field} harus berupa teks`
      );
    }
  }

  try {
    const normalized = { ...body };

    for (const field of [
      'full_name',
      'phone',
      'email',
      'date_of_birth',
      'gender',
      'address',
    ]) {
      if (typeof normalized[field] === 'string') {
        normalized[field] =
          normalized[field].trim() || null;
      }
    }

    const patient = await patientModel.updatePatient(
      id,
      normalized
    );

    if (!patient) {
      return fail(res, 404, 'Pasien tidak ditemukan');
    }

    return success(
      res,
      200,
      'Data pasien berhasil diperbarui',
      patient
    );
  } catch (error) {
    console.error('[updatePatient]', error);

    return fail(
      res,
      500,
      'Terjadi kesalahan saat memperbarui pasien'
    );
  }
};

const deletePatient = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID pasien tidak valid');
  }

  try {
    const deleted = await patientModel.deletePatient(id);

    if (!deleted) {
      return fail(res, 404, 'Pasien tidak ditemukan');
    }

    return success(
      res,
      200,
      'Pasien berhasil dihapus'
    );
  } catch (error) {
    console.error('[deletePatient]', error);

    if (
      String(error.message).includes(
        'FOREIGN KEY constraint failed'
      )
    ) {
      return fail(
        res,
        409,
        'Pasien tidak dapat dihapus karena sudah memiliki riwayat appointment'
      );
    }

    return fail(
      res,
      500,
      'Terjadi kesalahan saat menghapus pasien'
    );
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};