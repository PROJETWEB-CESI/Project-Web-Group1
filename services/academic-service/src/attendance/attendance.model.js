const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    courseId: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    campusId: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    sessionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late'),
        allowNull: false,
        defaultValue: 'present',
    },
    justified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    justificationNote: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'attendances',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'courseId', 'sessionDate'],
        },
    ],
});

module.exports = Attendance;
