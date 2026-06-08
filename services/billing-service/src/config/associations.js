const Invoice = require('../invoices/invoices.model');
const Payment = require('../payments/payments.model');

function setupAssociations() {
  // An invoice can have many payments
  Invoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments' });
  Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
}

module.exports = setupAssociations;
