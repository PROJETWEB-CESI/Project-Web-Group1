const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Course = sequelize.define('Course', {
    courseId: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        field: 'course_id',
    },
    courseName: {
        type: DataTypes.STRING(160),
        allowNull: false,
        field: 'course_name',
    },
    credits: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    semester: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
}, {
    tableName: 'courses',
    timestamps: false,
});

module.exports = Course;
