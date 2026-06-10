const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Program = sequelize.define('Program', {
  programId:      { type: DataTypes.STRING(10),    primaryKey: true, field: 'program_id' },
  programName:    { type: DataTypes.STRING(160),   field: 'program_name' },
  programType:    { type: DataTypes.STRING(20),    allowNull: true,  field: 'program_type' },
  durationYears:  { type: DataTypes.SMALLINT,      allowNull: true,  field: 'duration_years' },
  annualTuition:  { type: DataTypes.DECIMAL(10,2), allowNull: true,  field: 'annual_tuition' },
  campusId:       { type: DataTypes.STRING(10),    allowNull: true,  field: 'campus_id' },
  department:     { type: DataTypes.STRING(60),    allowNull: true,  field: 'department' },
  maxStudents:    { type: DataTypes.INTEGER,       allowNull: true,  field: 'max_students' },
  status:         { type: DataTypes.STRING(20),    allowNull: true,  field: 'status' },
}, { tableName: 'programs', timestamps: false });

module.exports = Program;
