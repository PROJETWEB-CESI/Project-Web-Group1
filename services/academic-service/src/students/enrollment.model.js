const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Enrollment = sequelize.define('Enrollment', {
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
        type: DataTypes.UUID,
        allowNull: false,
    },
    semester: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    academicYear: {
        type: DataTypes.STRING(9),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('enrolled', 'completed', 'dropped', 'failed'),
        allowNull: false,
        defaultValue: 'enrolled',
    },
    ects: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    finalGrade: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    attendanceRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
}, {
    tableName: 'enrollments',
    timestamps: true,
    indexes: [
        {
            // Un étudiant ne peut être inscrit qu'une fois par cours par année
            unique: true,
            fields: ['studentId', 'courseId', 'academicYear'],
        },
    ],
});

module.exports = Enrollment;
