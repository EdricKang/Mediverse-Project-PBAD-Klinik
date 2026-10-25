const doctorModel = require('../models/doctorModel');

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

const parseId = (rawId) => {
  if (!/^\d+$/.test(String(rawId))) {
    return null;
  }

  const id = Number(rawId);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
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

    return fail(res, 500, 'Terjadi kesalahan pada server');
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

    return fail(res, 500, 'Terjadi kesalahan pada server');
  }
};

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

  if (!fullName || !specialization) {
    return fail(
      res,
      400,
      'Nama dokter dan spesialisasi wajib diisi'
    );
  }

  const textFields = [
    'title_prefix',
    'title_suffix',
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

  const normalizeOptionalText = (value) => {
    if (typeof value !== 'string') {
      return null;
    }

    return value.trim() || null;
  };

  try {
    const doctor = await doctorModel.createDoctor({
      title_prefix: normalizeOptionalText(body.title_prefix),
      full_name: fullName,
      title_suffix: normalizeOptionalText(body.title_suffix),
      specialization,
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
    console.error('[createDoctor]', error);

    return fail(res, 500, 'Gagal menambahkan dokter');
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

  try {
    const normalized = { ...body };

    for (const field of textFields) {
      if (typeof normalized[field] === 'string') {
        normalized[field] =
          normalized[field].trim() || null;
      }
    }

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
    console.error('[updateDoctor]', error);

    return fail(res, 500, 'Gagal memperbarui dokter');
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

    return fail(res, 500, 'Gagal memperbarui status dokter');
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
};