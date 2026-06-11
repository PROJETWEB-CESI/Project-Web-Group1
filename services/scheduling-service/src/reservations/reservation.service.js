const { Op } = require('sequelize');
const Reservation = require('./reservation.model');
const Room = require('../rooms/room.model');

Reservation.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

function timeToMin(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
}

async function getReservations(filters = {}) {
  const where = { status: 'confirmed' };
  if (filters.campus_id)    where.campus_id = filters.campus_id;
  if (filters.room_id)      where.room_id = filters.room_id;
  if (filters.date)         where.date = filters.date;
  if (filters.instructor_id) where.instructor_id = filters.instructor_id;

  return Reservation.findAll({
    where,
    include: [{ model: Room, as: 'room', attributes: ['room_id', 'room_name', 'building', 'room_type', 'capacity'] }],
    order: [['date', 'ASC'], ['start_time', 'ASC']],
  });
}

async function createReservation(data) {
  const { room_id, instructor_id, campus_id, date, start_time, end_time, purpose } = data;

  if (!room_id || !instructor_id || !campus_id || !date || !start_time || !end_time) {
    throw new Error('room_id, instructor_id, campus_id, date, start_time et end_time sont obligatoires');
  }
  if (timeToMin(start_time) >= timeToMin(end_time)) {
    throw new Error('start_time doit être avant end_time');
  }

  // Check for conflicting reservations on the same room + date
  const conflicts = await Reservation.findAll({
    where: {
      room_id,
      date,
      status: 'confirmed',
      start_time: { [Op.lt]: end_time },
      end_time:   { [Op.gt]: start_time },
    },
  });
  if (conflicts.length > 0) {
    throw new Error('La salle est déjà réservée sur ce créneau');
  }

  return Reservation.create({ room_id, instructor_id, campus_id, date, start_time, end_time, purpose });
}

async function cancelReservation(id, instructorId) {
  const reservation = await Reservation.findByPk(id);
  if (!reservation) throw new Error('Réservation introuvable');
  if (reservation.instructor_id !== instructorId) throw new Error('Non autorisé');
  return reservation.update({ status: 'cancelled' });
}

module.exports = { getReservations, createReservation, cancelReservation };
