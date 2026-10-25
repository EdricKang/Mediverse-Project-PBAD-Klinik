const {
  dbGet,
  dbAll,
} = require('../middlewares_helpers/sqlite3_helpers');

const findAllRooms = async () => {
  const query = `
    SELECT
      r.id,
      r.room_number,
      d.id AS doctor_id,
      d.full_name AS doctor_name
    FROM rooms r
    LEFT JOIN doctors d ON d.room_id = r.id
    ORDER BY CAST(r.room_number AS INTEGER)
  `;

  return dbAll(query);
};

const findRoomById = async (id) => {
  const query = `
    SELECT id, room_number
    FROM rooms
    WHERE id = ?
  `;

  return dbGet(query, [id]);
};

module.exports = {
  findAllRooms,
  findRoomById,
};