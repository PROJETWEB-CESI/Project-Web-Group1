const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Student = sequelize.define('Student', {
    id: { type: DataTypes.UUID, primaryKey: true },
    campusId: { type: DataTypes.UUID, allowNull: false },
    programmeId: { type: DataTypes.STRING(20), allowNull: false },
    entryYear: { type: DataTypes.INTEGER, allowNull: false },
    administrativeStatus: { type: DataTypes.STRING(20), allowNull: false },
}, {
    tableName: 'students',
    timestamps: true,
});

module.exports = Student;
