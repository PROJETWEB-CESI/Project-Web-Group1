const Room = require('./room.model');

async function getAllRooms(campusId) {
  const where = {};
  if (campusId) {
    where.campus_id = campusId;
  }
  return await Room.findAll({ where });
}

async function getRoomById(id) {
  return await Room.findByPk(id);
}

async function createRoom(data) {
  if (!data.room_id || !data.campus_id) {
    throw new Error('room_id and campus_id are required');
  }
  return await Room.create(data);
}

async function updateRoom(id, data) {
  const room = await Room.findByPk(id);
  if (!room) {
    throw new Error('Room not found');
  }
  return await room.update(data);
}

async function deleteRoom(id) {
  const room = await Room.findByPk(id);
  if (!room) {
    throw new Error('Room not found');
  }
  await room.destroy();
  return { message: 'Room deleted' };
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};