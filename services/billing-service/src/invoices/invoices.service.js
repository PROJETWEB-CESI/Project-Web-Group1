const { Op } = require('sequelize');
const Invoice = require('./invoices.model');
const Payment = require('../payments/payments.model');
const { generateReference } = require('../common/utils/billing.util');
const { publish } = require('../events/event-publisher');

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

// ─── READ ────────────────────────────────────────────────────────────────────

async function getAllInvoices({ campusId, status, studentId, classification } = {}) {
  const where = { campusId };
  if (status) where.status = status;
  if (studentId) where.studentId = studentId;

  if (classification) {
    const sixMonthsAgo = new Date(Date.now() - SIX_MONTHS_MS);
    where.status = 'overdue';
    if (classification === 'retard') {
      where.dueDate = { [Op.gte]: sixMonthsAgo };
    } else if (classification === 'important') {
      where.dueDate = { [Op.lt]: sixMonthsAgo };
    }
  }

  return Invoice.findAll({
    where,
    include: [{ model: Payment, as: 'payments' }],
    order: [['dueDate', 'ASC']],
  });
}

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

async function getInvoicesByStudent(studentId, campusId) {
  return Invoice.findAll({
    where: { studentId, campusId },
    include: [{ model: Payment, as: 'payments' }],
    order: [['dueDate', 'ASC']],
  });
}

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

async function createInvoice({ campusId, studentId, programmeId, description, totalAmount, scholarshipAmount, dueDate }) {
  const reference = await generateReference(campusId);

  const invoice = await Invoice.create({
    campusId,
    studentId,
    programmeId: programmeId || null,
    reference,
    description,
    totalAmount,
    scholarshipAmount: scholarshipAmount || 0,
    paidAmount: 0,
    dueDate,
    status: 'pending',
  });

  publish('InvoiceCreated', {
    invoiceId: invoice.id,
    campusId,
    studentId,
    reference: invoice.reference,
    totalAmount,
    dueDate,
  });

  return invoice;
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

async function updateInvoice(id, campusId, fields) {
  const invoice = await getInvoiceById(id, campusId);

  const allowed = ['description', 'dueDate', 'status', 'adminNotes', 'scholarshipAmount'];
  allowed.forEach((key) => {
    if (fields[key] !== undefined) invoice[key] = fields[key];
  });

  await invoice.save();
  return invoice;
}

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

  if (invoice.status === 'pending') {
    invoice.status = 'overdue';
  }

  await invoice.save();

  publish('DunningAdvanced', {
    invoiceId: invoice.id,
    campusId,
    studentId: invoice.studentId,
    reference: invoice.reference,
    dunningLevel: next,
    amount: invoice.totalAmount,
  });

  return invoice;
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

async function cancelInvoice(id, campusId) {
  const invoice = await getInvoiceById(id, campusId);

  if (['paid', 'cancelled'].includes(invoice.status)) {
    const err = new Error(`Cannot cancel an invoice with status "${invoice.status}"`);
    err.status = 400;
    throw err;
  }

  invoice.status = 'cancelled';
  await invoice.save();

  publish('InvoiceCancelled', {
    invoiceId: invoice.id,
    campusId,
    studentId: invoice.studentId,
    reference: invoice.reference,
  });

  return invoice;
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────

async function getBillingSummary(campusId) {
  const invoices = await Invoice.findAll({
    where: { campusId },
    include: [{ model: Payment, as: 'payments' }],
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);

  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + (parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount)),
    0
  );

  const sixMonthsAgo = new Date(Date.now() - SIX_MONTHS_MS);
  const overdueByClassification = {
    retard: overdueInvoices.filter((inv) => new Date(inv.dueDate) >= sixMonthsAgo).length,
    important: overdueInvoices.filter((inv) => new Date(inv.dueDate) < sixMonthsAgo).length,
  };

  // Average recovery delay (days from dueDate to last completed payment) for paid invoices
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.payments && inv.payments.length > 0);
  let averageRecoveryDays = null;
  if (paidInvoices.length > 0) {
    const delays = paidInvoices.map((inv) => {
      const lastPayment = [...inv.payments]
        .filter((p) => p.status === 'completed')
        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0];
      if (!lastPayment) return 0;
      const days = Math.ceil((new Date(lastPayment.paidAt) - new Date(inv.dueDate)) / 86400000);
      return Math.max(0, days);
    });
    averageRecoveryDays = Math.round(delays.reduce((a, b) => a + b, 0) / delays.length);
  }

  return {
    totalInvoiced: totalInvoiced.toFixed(2),
    totalCollected: totalCollected.toFixed(2),
    totalOverdue: totalOverdue.toFixed(2),
    overdueCount: overdueInvoices.length,
    percentageCollected: totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0.0',
    averageRecoveryDays,
    overdueByClassification,
  };
}

// Cross-campus breakdown — reserved for executive role (no campusId scoping)
async function getBillingSummaryByCampus() {
  const invoices = await Invoice.findAll({
    where: { status: { [Op.in]: ['pending', 'overdue', 'paid', 'on_hold'] } },
  });

  const byCampus = {};
  for (const inv of invoices) {
    const cId = inv.campusId;
    if (!byCampus[cId]) {
      byCampus[cId] = { campusId: cId, totalInvoiced: 0, totalCollected: 0, totalOverdue: 0, overdueCount: 0 };
    }
    byCampus[cId].totalInvoiced += parseFloat(inv.totalAmount);
    byCampus[cId].totalCollected += parseFloat(inv.paidAmount);
    if (inv.status === 'overdue') {
      byCampus[cId].totalOverdue += parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount);
      byCampus[cId].overdueCount += 1;
    }
  }

  return Object.values(byCampus).map((c) => ({
    ...c,
    totalInvoiced: c.totalInvoiced.toFixed(2),
    totalCollected: c.totalCollected.toFixed(2),
    totalOverdue: c.totalOverdue.toFixed(2),
  }));
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
  getBillingSummaryByCampus,
};
