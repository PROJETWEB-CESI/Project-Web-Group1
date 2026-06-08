const { Op } = require('sequelize');
const Invoice = require('./invoices.model');
const Payment = require('../payments/payments.model');
const { generateReference } = require('../common/utils/billing.util');

// ─── READ ────────────────────────────────────────────────────────────────────

/**
 * Return all invoices for a given campus, with optional filters.
 * Used by admin dashboard and executive KPI views.
 */
async function getAllInvoices({ campusId, status, studentId } = {}) {
  const where = { campusId };
  if (status) where.status = status;
  if (studentId) where.studentId = studentId;

  return Invoice.findAll({
    where,
    include: [{ model: Payment, as: 'payments' }],
    order: [['dueDate', 'ASC']],
  });
}

/**
 * Return a single invoice by id, scoped to the campus.
 * Throws if not found.
 */
async function getInvoiceById(id, campusId) {
  const invoice = await Invoice.findOne({
    where: { id, campusId },
    include: [{ model: Payment, as: 'payments' }],
  });

  if (!invoice) {
    const err = new Error('Invoice not found');
    err.status = 404;
    throw err;
  }

  return invoice;
}

/**
 * Return all invoices for a specific student (used by the student dashboard).
 */
async function getInvoicesByStudent(studentId, campusId) {
  return Invoice.findAll({
    where: { studentId, campusId },
    include: [{ model: Payment, as: 'payments' }],
    order: [['dueDate', 'ASC']],
  });
}

/**
 * Return invoices that are overdue — used for the dunning workflow.
 * An invoice is overdue when dueDate < today AND status is still 'pending'.
 */
async function getOverdueInvoices(campusId) {
  return Invoice.findAll({
    where: {
      campusId,
      status: 'pending',
      dueDate: { [Op.lt]: new Date() },
    },
    include: [{ model: Payment, as: 'payments' }],
    order: [['dueDate', 'ASC']],
  });
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

/**
 * Create a new invoice.
 * Automatically generates a unique human-readable reference.
 */
async function createInvoice({ campusId, studentId, description, totalAmount, scholarshipAmount, dueDate }) {
  const reference = await generateReference(campusId);

  const invoice = await Invoice.create({
    campusId,
    studentId,
    reference,
    description,
    totalAmount,
    scholarshipAmount: scholarshipAmount || 0,
    paidAmount: 0,
    dueDate,
    status: 'pending',
  });

  return invoice;
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

/**
 * Update editable fields of an invoice (description, dueDate, adminNotes, status).
 * paidAmount is updated internally via recordPayment, not directly.
 */
async function updateInvoice(id, campusId, fields) {
  const invoice = await getInvoiceById(id, campusId);

  const allowed = ['description', 'dueDate', 'status', 'adminNotes', 'scholarshipAmount'];
  allowed.forEach((key) => {
    if (fields[key] !== undefined) invoice[key] = fields[key];
  });

  await invoice.save();
  return invoice;
}

/**
 * Advance the dunning level of an overdue invoice (null → R1 → R2 → R3).
 * Also records the timestamp of the last reminder sent.
 * Called by the automated collection workflow (or manually by an admin).
 */
async function advanceDunning(id, campusId) {
  const invoice = await getInvoiceById(id, campusId);

  const levels = [null, 'R1', 'R2', 'R3'];
  const current = levels.indexOf(invoice.dunningLevel);
  const next = levels[current + 1];

  if (!next) {
    const err = new Error('Invoice is already at the maximum dunning level (R3)');
    err.status = 400;
    throw err;
  }

  invoice.dunningLevel = next;
  invoice.lastReminderSentAt = new Date();

  // Mark overdue if not already flagged
  if (invoice.status === 'pending') {
    invoice.status = 'overdue';
  }

  await invoice.save();
  return invoice;
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

/**
 * Cancel (soft-delete) an invoice by setting its status to 'cancelled'.
 * Hard deletion is intentionally not exposed to preserve audit history.
 */
async function cancelInvoice(id, campusId) {
  const invoice = await getInvoiceById(id, campusId);

  if (['paid', 'cancelled'].includes(invoice.status)) {
    const err = new Error(`Cannot cancel an invoice with status "${invoice.status}"`);
    err.status = 400;
    throw err;
  }

  invoice.status = 'cancelled';
  await invoice.save();
  return invoice;
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────

/**
 * Return aggregate billing figures for a campus (used by admin/exec dashboards).
 * Returns: { totalInvoiced, totalCollected, totalOverdue, overdueCount }
 */
async function getBillingSummary(campusId) {
  const invoices = await Invoice.findAll({ where: { campusId } });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);

  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + (parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount)),
    0
  );

  return {
    totalInvoiced: totalInvoiced.toFixed(2),
    totalCollected: totalCollected.toFixed(2),
    totalOverdue: totalOverdue.toFixed(2),
    overdueCount: overdueInvoices.length,
  };
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  getInvoicesByStudent,
  getOverdueInvoices,
  createInvoice,
  updateInvoice,
  advanceDunning,
  cancelInvoice,
  getBillingSummary,
};
