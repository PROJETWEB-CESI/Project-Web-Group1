const Payment = require('./payments.model');
const Invoice = require('../invoices/invoices.model');

// ─── READ ────────────────────────────────────────────────────────────────────

/**
 * Return all payments for a given invoice.
 */
async function getPaymentsByInvoice(invoiceId, campusId) {
  // First verify the invoice belongs to this campus
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

/**
 * Return a single payment by id.
 */
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

/**
 * Record a payment against an invoice.
 * - Creates the Payment row.
 * - Updates invoice.paidAmount.
 * - Automatically marks invoice as 'paid' when paidAmount >= (totalAmount - scholarshipAmount).
 */
async function recordPayment({ invoiceId, campusId, amount, method, transactionReference, notes, paidAt }) {
  // Guard: invoice must exist and belong to this campus
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

  // Update cumulative paidAmount on the invoice
  const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(amount);
  invoice.paidAmount = newPaidAmount.toFixed(2);

  // Net amount owed = totalAmount - scholarshipAmount
  const netOwed = parseFloat(invoice.totalAmount) - parseFloat(invoice.scholarshipAmount);

  if (newPaidAmount >= netOwed) {
    invoice.status = 'paid';
    invoice.dunningLevel = null; // clear dunning once paid
  } else if (invoice.status === 'overdue') {
    // Partial payment received — keep overdue but clear dunning progression if needed
    invoice.status = 'overdue';
  } else {
    invoice.status = 'pending';
  }

  await invoice.save();

  return payment;
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

/**
 * Update the status of a payment (e.g. mark as 'refunded' or 'failed').
 * Also adjusts invoice.paidAmount accordingly when refunding.
 */
async function updatePaymentStatus(id, campusId, newStatus) {
  const payment = await getPaymentById(id);

  // Verify campus ownership through the parent invoice
  const invoice = await Invoice.findOne({ where: { id: payments.invoiceId, campusId } });
  if (!invoice) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  const oldStatus = payments.status;
  payments.status = newStatus;
  await payments.save();

  // If refunding a previously completed payment, reduce invoice.paidAmount
  if (oldStatus === 'completed' && newStatus === 'refunded') {
    const newPaidAmount = Math.max(0, parseFloat(invoice.paidAmount) - parseFloat(payments.amount));
    invoice.paidAmount = newPaidAmount.toFixed(2);

    // Reopen invoice if it was marked as paid
    if (invoice.status === 'paid') {
      invoice.status = 'pending';
    }

    await invoice.save();
  }

  return payment;
}

module.exports = {
  getPaymentsByInvoice,
  getPaymentById,
  recordPayment,
  updatePaymentStatus,
};
