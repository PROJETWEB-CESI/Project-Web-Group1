const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Attendance = sequelize.define('Attendance', {
    id: { type: DataTypes.UUID, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    courseId: { type: DataTypes.STRING(20), allowNull: false },
    campusId: { type: DataTypes.UUID, allowNull: false },
    sessionDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING(10), allowNull: false },
    justified: { type: DataTypes.BOOLEAN, allowNull: false },
}, {
    tableName: 'attendances',
    timestamps: true,
});

module.exports = Attendance;
