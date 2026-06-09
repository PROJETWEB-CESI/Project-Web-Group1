const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Student = sequelize.define('Student', {
    // PK réelle de la table (créée par le seeder)
    studentId: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        field: 'student_id',
    },
    // UUID ajouté par Sequelize lors d'une précédente sync (gardé pour les associations)
    id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    // Référence vers l'utilisateur IAM
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
    },
    firstName: {
        type: DataTypes.STRING(60),
        allowNull: true,
        field: 'first_name',
    },
    lastName: {
        type: DataTypes.STRING(60),
        allowNull: true,
        field: 'last_name',
    },
    email: {
        type: DataTypes.STRING(120),
        allowNull: true,
        unique: true,
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth',
    },
    campusId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'campus_id',
    },
    programId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'program_id',
    },
    enrollmentYear: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        field: 'enrollment_year',
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'Active',
    },
    paymentStatus: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'payment_status',
    },
    address: {
        type: DataTypes.STRING(160),
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING(80),
        allowNull: true,
    },
    zipCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'zip_code',
    },
    emergencyContact: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'emergency_contact',
    },
    emergencyPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'emergency_phone',
    },
}, {
    tableName: 'students',
    timestamps: false,
});

module.exports = Student;
