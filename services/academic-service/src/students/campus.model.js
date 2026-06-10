const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Campus = sequelize.define('Campus', {
  campusId:   { type: DataTypes.STRING(10), primaryKey: true, field: 'campus_id' },
  campusName: { type: DataTypes.STRING(120), field: 'campus_name' },
}, { tableName: 'campuses', timestamps: false });

module.exports = Campus;
