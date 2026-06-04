const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Grade = sequelize.define('Grade', {
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
    evaluationName: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    scoreMax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 20,
    },
    coefficient: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    evaluationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    annotation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'grades',
    timestamps: true,
});

module.exports = Grade;
