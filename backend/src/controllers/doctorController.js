const doctorModel = require('../models/doctorModel');

const success = (res, status, message, data = null) =>
  res.status(status).json({
    success: true,
    message,
    data,
  });

const fail = (res, status, message, error = null) =>
  res.status(status).json({
    success: false,
    message,
    error,
  });

const parseId = (rawId) => {
  if (!/^\d+$/.test(String(rawId))) {
    return null;
  }

  const id = Number(rawId);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

const parseRoomNumber = (value) => {
  if (typeof value === 'string') {
    const normalized = value.trim();

    return normalized.length > 0 && normalized.length <= 20
      ? normalized
      : null;
  }

  if (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0
  ) {
    return String(value);
  }

  return null;
};

const normalizeOptionalText = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim() || null;
};

const handleDoctorError = (res, error, action) => {
  if (
    error.message?.includes(
      'UNIQUE constraint failed: doctors.room_number'
    )
  ) {
    return fail(
      res,
      409,
      'Nomor ruangan sudah digunakan dokter lain'
    );
  }

  console.error(`[${action}]`, error);

  return fail(
    res,
    500,
    action === 'createDoctor'
      ? 'Gagal menambahkan dokter'
      : 'Gagal memperbarui data dokter'
  );
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.findAllDoctors();

    return success(
      res,
      200,
      'Berhasil mengambil semua dokter',
      doctors
    );
  } catch (error) {
    console.error('[getAllDoctors]', error);

    return fail(
      res,
      500,
      'Terjadi kesalahan pada server'
    );
  }
};

const getDoctorById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID dokter tidak valid');
  }

  try {
    const doctor = await doctorModel.findDoctorById(id);

    if (!doctor) {
      return fail(res, 404, 'Dokter tidak ditemukan');
    }

    return success(
      res,
      200,
      'Berhasil mengambil data dokter',
      doctor
    );
  } catch (error) {
    console.error('[getDoctorById]', error);

    return fail(
      res,
      500,
      'Terjadi kesalahan pada server'
    );
  }
};

const optionalTextFields = [
  'title_prefix',
  'title_suffix',
  'phone',
  'email',
];

const createDoctor = async (req, res) => {
  const body = req.body ?? {};

  const fullName =
    typeof body.full_name === 'string'
      ? body.full_name.trim()
      : '';

  const specialization =
    typeof body.specialization === 'string'
      ? body.specialization.trim()
      : '';

  const roomNumber = parseRoomNumber(body.room_number);

  if (!fullName || !specialization) {
    return fail(
      res,
      400,
      'Nama dokter dan spesialisasi wajib diisi'
    );
  }

  if (!roomNumber) {
    return fail(
      res,
      400,
      'room_number wajib diisi dengan nomor ruangan yang valid'
    );
  }

  for (const field of optionalTextFields) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      typeof body[field] !== 'string'
    ) {
      return fail(
        res,
        400,
        `${field} harus berupa teks`
      );
    }
  }

  try {
    const doctor = await doctorModel.createDoctor({
      title_prefix: normalizeOptionalText(body.title_prefix),
      full_name: fullName,
      title_suffix: normalizeOptionalText(body.title_suffix),
      specialization,
      room_number: roomNumber,
      phone: normalizeOptionalText(body.phone),
      email: normalizeOptionalText(body.email),
    });

    return success(
      res,
      201,
      'Dokter berhasil ditambahkan',
      doctor
    );
  } catch (error) {
    return handleDoctorError(
      res,
      error,
      'createDoctor'
    );
  }
};

const updateDoctor = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID dokter tidak valid');
  }

  const body = req.body ?? {};

  const textFields = [
    'title_prefix',
    'full_name',
    'title_suffix',
    'specialization',
    'phone',
    'email',
  ];

  for (const field of textFields) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      typeof body[field] !== 'string'
    ) {
      return fail(
        res,
        400,
        `${field} harus berupa teks`
      );
    }
  }

  for (const field of ['full_name', 'specialization']) {
    if (
      body[field] !== undefined &&
      (
        typeof body[field] !== 'string' ||
        !body[field].trim()
      )
    ) {
      return fail(
        res,
        400,
        `${field} tidak boleh kosong`
      );
    }
  }

  const normalized = { ...body };

  if (body.room_number !== undefined) {
    const roomNumber = parseRoomNumber(body.room_number);

    if (!roomNumber) {
      return fail(
        res,
        400,
        'room_number tidak valid'
      );
    }

    normalized.room_number = roomNumber;
  }

  for (const field of textFields) {
    if (typeof normalized[field] === 'string') {
      normalized[field] =
        normalized[field].trim() || null;
    }
  }

  try {
    const doctor = await doctorModel.updateDoctor(
      id,
      normalized
    );

    if (!doctor) {
      return fail(res, 404, 'Dokter tidak ditemukan');
    }

    return success(
      res,
      200,
      'Data dokter berhasil diperbarui',
      doctor
    );
  } catch (error) {
    return handleDoctorError(
      res,
      error,
      'updateDoctor'
    );
  }
};

const updateDoctorStatus = async (req, res) => {
  const id = parseId(req.params.id);
  const { is_active } = req.body ?? {};

  if (!id) {
    return fail(res, 400, 'ID dokter tidak valid');
  }

  if (![true, false, 1, 0].includes(is_active)) {
    return fail(
      res,
      400,
      'is_active harus berupa true, false, 1, atau 0'
    );
  }

  try {
    const doctor = await doctorModel.updateDoctorStatus(
      id,
      Boolean(is_active)
    );

    if (!doctor) {
      return fail(res, 404, 'Dokter tidak ditemukan');
    }

    return success(
      res,
      200,
      'Status dokter berhasil diperbarui',
      doctor
    );
  } catch (error) {
    console.error('[updateDoctorStatus]', error);

    return fail(
      res,
      500,
      'Gagal memperbarui status dokter'
    );
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
};