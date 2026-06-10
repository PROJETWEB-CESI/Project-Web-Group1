const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Instructor = sequelize.define('Instructor', {
  instructor_id: { type: DataTypes.STRING(10), primaryKey: true },
  first_name: { type: DataTypes.STRING(60) },
  last_name: { type: DataTypes.STRING(60) },
}, {
  tableName: 'instructors',
  timestamps: false,
});

module.exports = Instructor;
