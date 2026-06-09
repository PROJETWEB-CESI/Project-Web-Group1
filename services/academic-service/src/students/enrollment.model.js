const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Enrollment = sequelize.define('Enrollment', {
    enrollmentId: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        field: 'enrollment_id',
    },
    studentId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'student_id',
    },
    courseId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'course_id',
    },
    semester: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    academicYear: {
        type: DataTypes.STRING(12),
        allowNull: true,
        field: 'academic_year',
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    finalGrade: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        field: 'final_grade',
    },
    attendanceRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        field: 'attendance_rate',
    },
    enrollmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'enrollment_date',
    },
}, {
    tableName: 'enrollments',
    timestamps: false,
});

module.exports = Enrollment;
