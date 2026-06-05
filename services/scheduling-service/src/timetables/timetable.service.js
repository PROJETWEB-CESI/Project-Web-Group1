const { Op } = require('sequelize');
const Timetable = require('./timetable.model');

async function getAllTimetables(filters = {}) {
  const where = {};
  if (filters.campus_id) {
    // Note: campus filtering would typically join through course or room, but for simplicity we assume it's passed or handled upstream
    // Here we filter directly if campus data is denormalized, but per schema we keep it flexible
  }
  if (filters.instructor_id) where.instructor_id = filters.instructor_id;
  if (filters.room_id) where.room_id = filters.room_id;
  if (filters.course_id) where.course_id = filters.course_id;
  if (filters.semester) where.semester = filters.semester;
  if (filters.academic_year) where.academic_year = filters.academic_year;

  return await Timetable.findAll({ where });
}

async function getTimetableById(id) {
  return await Timetable.findByPk(id);
}

async function checkForConflicts(data, excludeId = null) {
  const where = {
    day_of_week: data.day_of_week,
    semester: data.semester,
    academic_year: data.academic_year,
    [Op.or]: [
      { room_id: data.room_id },
      { instructor_id: data.instructor_id },
    ],
    start_time: { [Op.lt]: data.end_time },
    end_time: { [Op.gt]: data.start_time },
  };

  if (excludeId) {
    where.schedule_id = { [Op.ne]: excludeId };
  }

  const conflicts = await Timetable.findAll({ where });
  return conflicts;
}

async function createTimetable(data) {
  if (!data.schedule_id || !data.course_id || !data.day_of_week || !data.start_time || !data.end_time) {
    throw new Error('schedule_id, course_id, day_of_week, start_time and end_time are required');
  }

  const conflicts = await checkForConflicts(data);
  if (conflicts.length > 0) {
    throw new Error('Scheduling conflict detected for room or instructor');
  }

  return await Timetable.create(data);
}

async function updateTimetable(id, data) {
  const timetable = await Timetable.findByPk(id);
  if (!timetable) {
    throw new Error('Timetable not found');
  }

  const conflicts = await checkForConflicts(data, id);
  if (conflicts.length > 0) {
    throw new Error('Scheduling conflict detected for room or instructor');
  }

  return await timetable.update(data);
}

async function deleteTimetable(id) {
  const timetable = await Timetable.findByPk(id);
  if (!timetable) {
    throw new Error('Timetable not found');
  }
  await timetable.destroy();
  return { message: 'Timetable deleted' };
}

module.exports = {
  getAllTimetables,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
};