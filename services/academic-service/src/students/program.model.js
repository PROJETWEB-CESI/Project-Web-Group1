const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Program = sequelize.define('Program', {
  programId:   { type: DataTypes.STRING(10), primaryKey: true, field: 'program_id' },
  programName: { type: DataTypes.STRING(160), field: 'program_name' },
}, { tableName: 'programs', timestamps: false });

module.exports = Program;
