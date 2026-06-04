const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // Référence vers l'utilisateur IAM
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
    },
    campusId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    studentNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    firstName: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    programmeId: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    entryYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    administrativeStatus: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
    },
    scholarshipAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
    },
}, {
    tableName: 'students',
    timestamps: true,
});

module.exports = Student;
