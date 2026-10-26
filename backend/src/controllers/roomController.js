const roomModel = require('../models/roomModel');

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
  if (!/^\d+$/.test(String(value))) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const getAllRooms = async (req, res) => {
  try {
    const rooms = await roomModel.findAllRooms();

    return success(
      res,
      200,
      'Berhasil mengambil daftar ruangan',
      rooms
    );
  } catch (error) {
    console.error('[getAllRooms]', error);

    return fail(res, 500, 'Gagal mengambil daftar ruangan');
  }
};

const getRoomById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return fail(res, 400, 'ID ruangan tidak valid');
  }

  try {
    const room = await roomModel.findRoomById(id);

    if (!room) {
      return fail(res, 404, 'Ruangan tidak ditemukan');
    }

    return success(res, 200, 'Berhasil mengambil ruangan', room);
  } catch (error) {
    console.error('[getRoomById]', error);

    return fail(res, 500, 'Gagal mengambil data ruangan');
  }
};

const createRoom = async (req, res) => {
  const rawRoomNumber = req.body?.room_number;

  const roomNumber =
    typeof rawRoomNumber === 'string'
      ? rawRoomNumber.trim()
      : typeof rawRoomNumber === 'number' &&
          Number.isSafeInteger(rawRoomNumber) &&
          rawRoomNumber > 0
        ? String(rawRoomNumber)
        : '';

  if (!roomNumber) {
    return fail(
      res,
      400,
      'room_number wajib diisi dengan teks atau angka positif'
    );
  }

  if (roomNumber.length > 20) {
    return fail(res, 400, 'Nomor ruangan maksimal 20 karakter');
  }

  try {
    const room = await roomModel.createRoom(roomNumber);

    return success(
      res,
      201,
      'Ruangan berhasil ditambahkan',
      room
    );
  } catch (error) {
    if (
      error.message?.includes(
        'UNIQUE constraint failed: rooms.room_number'
      )
    ) {
      return fail(res, 409, 'Nomor ruangan sudah digunakan');
    }

    console.error('[createRoom]', error);

    return fail(res, 500, 'Gagal menambahkan ruangan');
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
};