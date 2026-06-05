const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Grade = sequelize.define('Grade', {
    id: { type: DataTypes.UUID, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    courseId: { type: DataTypes.STRING(20), allowNull: false },
    campusId: { type: DataTypes.UUID, allowNull: false },
    score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    scoreMax: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    coefficient: { type: DataTypes.INTEGER, allowNull: false },
    evaluationDate: { type: DataTypes.DATEONLY, allowNull: false },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'grades',
    timestamps: true,
});

module.exports = Grade;
