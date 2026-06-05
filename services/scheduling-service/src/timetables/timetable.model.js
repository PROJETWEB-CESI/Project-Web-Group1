const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Timetable = sequelize.define('Timetable', {
  schedule_id: {
    type: DataTypes.STRING(10),
    primaryKey: true,
  },
  course_id: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  instructor_id: {
    type: DataTypes.STRING(10),
  },
  room_id: {
    type: DataTypes.STRING(10),
  },
  day_of_week: {
    type: DataTypes.STRING(12),
  },
  start_time: {
    type: DataTypes.TIME,
  },
  end_time: {
    type: DataTypes.TIME,
  },
  semester: {
    type: DataTypes.SMALLINT,
  },
  academic_year: {
    type: DataTypes.STRING(12),
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Active',
  },
  last_modified: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'schedules',
  timestamps: false,
});

module.exports = Timetable;