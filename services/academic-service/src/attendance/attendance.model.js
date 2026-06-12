const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    studentId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'student_id',
    },
    courseId: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'course_id',
    },
    campusId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'campus_id',
    },
    sessionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'session_date',
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
        field: 'justification_note',
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'created_at',
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'updated_at',
    },
}, {
    tableName: 'attendances',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['student_id', 'course_id', 'session_date'],
        },
    ],
});

module.exports = Attendance;
