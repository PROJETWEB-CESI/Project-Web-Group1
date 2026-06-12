const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Course = sequelize.define('Course', {
  course_id: { type: DataTypes.STRING(10), primaryKey: true },
  course_name: { type: DataTypes.STRING(160) },
  credits: { type: DataTypes.SMALLINT },
  course_type: { type: DataTypes.STRING(40) },
}, {
  tableName: 'courses',
  timestamps: false,
});

module.exports = Course;
