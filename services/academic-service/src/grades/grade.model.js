const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Grade = sequelize.define('Grade', {
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
    evaluationName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'evaluation_name',
    },
    evaluationNameEn: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'evaluation_name_en',
    },
    score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    scoreMax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 20,
        field: 'score_max',
    },
    coefficient: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    evaluationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'evaluation_date',
    },
    annotation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'published_at',
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
    tableName: 'grades',
    timestamps: true,
});

module.exports = Grade;
