const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Payment = sequelize.define('Payment', {
    paymentId: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        field: 'payment_id',
    },
    studentId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'student_id',
    },
    invoiceDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'invoice_date',
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'due_date',
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: true,
        // 'Paid' | 'Delay'
    },
    paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'payment_date',
    },
    paymentMethod: {
        type: DataTypes.STRING(40),
        allowNull: true,
        field: 'payment_method',
    },
    academicYear: {
        type: DataTypes.STRING(12),
        allowNull: true,
        field: 'academic_year',
    },
    semester: {
        type: DataTypes.SMALLINT,
        allowNull: true,
    },
    notes: {
        type: DataTypes.STRING(160),
        allowNull: true,
    },
    notesEn: {
        type: DataTypes.STRING(160),
        allowNull: true,
        field: 'notes_en',
    },
}, {
    tableName: 'payments',
    timestamps: false,
});

module.exports = Payment;
