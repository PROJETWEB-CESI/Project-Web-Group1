const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Program = sequelize.define('Program', {
  programId:      { type: DataTypes.STRING(10),    primaryKey: true, field: 'program_id' },
  programName:    { type: DataTypes.STRING(160),   field: 'program_name' },
  durationYears:  { type: DataTypes.SMALLINT,      allowNull: true,  field: 'duration_years' },
  annualTuition:  { type: DataTypes.DECIMAL(10,2), allowNull: true,  field: 'annual_tuition' },
}, { tableName: 'programs', timestamps: false });

module.exports = Program;
