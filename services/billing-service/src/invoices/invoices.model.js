const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

// Possible statuses for an invoice
// pending   → awaiting payment
// paid      → fully settled
// overdue   → past due date, not paid
// cancelled → voided invoice
// on_hold   → frozen pending admin action
const INVOICE_STATUSES = ['pending', 'paid', 'overdue', 'cancelled', 'on_hold'];

// Dunning levels for automated collection workflow (R1 / R2 / R3)
// null   → no reminder sent yet
// R1     → first reminder (soft, ~7 days after due date)
// R2     → second reminder (firm, ~14 days after due date)
// R3     → final notice / escalation (~30 days after due date)
const DUNNING_LEVELS = [null, 'R1', 'R2', 'R3'];

const Invoice = sequelize.define(
  'Invoice',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Tenant discriminator — every row belongs to exactly one campus
    campusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // The student this invoice is billed to
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Human-readable reference, e.g. "F-2025-0042"
    reference: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },

    // Short description shown to the student, e.g. "Tuition fees S1 2025-2026"
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    // Total amount billed (in euros, stored as decimal)
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Amount already received across all linked payments
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    // Scholarship / financial aid deducted from total before billing
    scholarshipAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    // Date by which full payment is expected
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(...INVOICE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },

    // Current dunning step in the automated collection workflow
    dunningLevel: {
      type: DataTypes.ENUM('R1', 'R2', 'R3'),
      allowNull: true,
      defaultValue: null,
    },

    // Date the last dunning reminder was sent (for throttling)
    lastReminderSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    // Free-text notes visible only to admins
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'invoices',
    timestamps: true, // createdAt + updatedAt managed by Sequelize
  }
);

module.exports = Invoice;
