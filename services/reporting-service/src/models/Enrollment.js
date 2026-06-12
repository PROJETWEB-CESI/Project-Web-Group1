const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Enrollment = sequelize.define('Enrollment', {
    id: { type: DataTypes.UUID, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    courseId: { type: DataTypes.STRING(20), allowNull: false },
    campusId: { type: DataTypes.UUID, allowNull: false },
    semester: { type: DataTypes.STRING(10), allowNull: false },
    academicYear: { type: DataTypes.STRING(9), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false },
    ects: { type: DataTypes.INTEGER, allowNull: false },
    finalGrade: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    attendanceRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
}, {
    tableName: 'enrollments',
    timestamps: true,
});

module.exports = Enrollment;
