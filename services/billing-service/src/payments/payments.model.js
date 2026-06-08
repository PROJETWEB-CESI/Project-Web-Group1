const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

// Supported payment methods
const PAYMENT_METHODS = ['card', 'bank_transfer', 'check', 'cash', 'scholarship'];

// Payment statuses
// completed → money confirmed received
// pending   → initiated but not yet confirmed (e.g. bank transfer in transit)
// failed    → transaction rejected
// refunded  → reversed after the fact
const PAYMENT_STATUSES = ['completed', 'pending', 'failed', 'refunded'];

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Links the payment to the parent invoice
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Amount covered by this specific payment transaction
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    method: {
      type: DataTypes.ENUM(...PAYMENT_METHODS),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(...PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'completed',
    },

    // Date the payment was actually received / processed
    paidAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // Optional external transaction reference (bank ref, payment gateway ID, etc.)
    transactionReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },

    // Free-text notes (e.g. "Paid by cashier desk — cash")
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'payments',
    timestamps: true,
  }
);

module.exports = Payment;
