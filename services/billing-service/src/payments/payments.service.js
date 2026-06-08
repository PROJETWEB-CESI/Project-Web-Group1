const Payment = require('./payments.model');
const Invoice = require('../invoices/invoices.model');
const { publish } = require('../events/event-publisher');

// ─── READ ────────────────────────────────────────────────────────────────────

async function getPaymentsByInvoice(invoiceId, campusId) {
  const invoice = await Invoice.findOne({ where: { id: invoiceId, campusId } });
  if (!invoice) {
    const err = new Error('Invoice not found');
    err.status = 404;
    throw err;
  }

  return Payment.findAll({
    where: { invoiceId },
    order: [['paidAt', 'DESC']],
  });
}

async function getPaymentById(id) {
  const payment = await Payment.findByPk(id, {
    include: [{ model: Invoice, as: 'invoice' }],
  });

  if (!payment) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  return payment;
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

async function recordPayment({ invoiceId, campusId, amount, method, transactionReference, notes, paidAt }) {
  const invoice = await Invoice.findOne({ where: { id: invoiceId, campusId } });
  if (!invoice) {
    const err = new Error('Invoice not found');
    err.status = 404;
    throw err;
  }

  if (invoice.status === 'cancelled') {
    const err = new Error('Cannot record a payment on a cancelled invoice');
    err.status = 400;
    throw err;
  }

  const payment = await Payment.create({
    invoiceId,
    amount,
    method,
    status: 'completed',
    transactionReference: transactionReference || null,
    notes: notes || null,
    paidAt: paidAt || new Date(),
  });

  const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(amount);
  invoice.paidAmount = newPaidAmount.toFixed(2);

  const netOwed = parseFloat(invoice.totalAmount) - parseFloat(invoice.scholarshipAmount);

  if (newPaidAmount >= netOwed) {
    invoice.status = 'paid';
    invoice.dunningLevel = null;
  } else if (invoice.status === 'overdue') {
    invoice.status = 'overdue';
  } else {
    invoice.status = 'pending';
  }

  await invoice.save();

  publish('PaymentReceived', {
    paymentId: payment.id,
    invoiceId,
    campusId,
    studentId: invoice.studentId,
    reference: invoice.reference,
    amount,
    method,
  });

  if (invoice.status === 'paid') {
    publish('InvoicePaid', {
      invoiceId,
      campusId,
      studentId: invoice.studentId,
      reference: invoice.reference,
      totalAmount: invoice.totalAmount,
    });
  }

  return payment;
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

async function updatePaymentStatus(id, campusId, newStatus) {
  const payment = await getPaymentById(id);

  const invoice = await Invoice.findOne({ where: { id: payment.invoiceId, campusId } });
  if (!invoice) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  const oldStatus = payment.status;
  payment.status = newStatus;
  await payment.save();

  if (oldStatus === 'completed' && newStatus === 'refunded') {
    const newPaidAmount = Math.max(0, parseFloat(invoice.paidAmount) - parseFloat(payment.amount));
    invoice.paidAmount = newPaidAmount.toFixed(2);

    if (invoice.status === 'paid') {
      invoice.status = 'pending';
    }

    await invoice.save();

    publish('PaymentRefunded', {
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      campusId,
      studentId: invoice.studentId,
      amount: payment.amount,
      invoiceReopened: invoice.status === 'pending',
    });
  }

  return payment;
}

module.exports = {
  getPaymentsByInvoice,
  getPaymentById,
  recordPayment,
  updatePaymentStatus,
};
