const express = require('express');
const router = express.Router();
const invoiceService = require('./invoices.service');
const { requireRole } = require('../middleware/rbac.middleware');
const { logAuditFromReq } = require('../audit/audit.service');

// ─── GET /invoices ──────────────────────────────────────────────────────────
// List invoices. Query params: ?status=&studentId=&classification=retard|important
// Access: admin, executive
router.get('/', requireRole('admin', 'executive'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const { status, studentId, classification } = req.query;

    const invoices = await invoiceService.getAllInvoices({
      campusId,
      status,
      studentId: studentId ? parseInt(studentId, 10) : undefined,
      classification,
    });

    res.status(200).json(invoices);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/summary ──────────────────────────────────────────────────
// Aggregate KPIs for the campus dashboard (incl. averageRecoveryDays).
// Access: admin, executive
router.get('/summary', requireRole('admin', 'executive'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const summary = await invoiceService.getBillingSummary(campusId);
    res.status(200).json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/cross-campus-summary ────────────────────────────────────
// Aggregate KPIs grouped by campus — for the executive dashboard.
// Access: executive
router.get('/cross-campus-summary', requireRole('executive'), async (req, res) => {
  try {
    const summary = await invoiceService.getBillingSummaryByCampus();
    res.status(200).json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/overdue ──────────────────────────────────────────────────
// Invoices past their due date that are still unpaid.
// Access: admin
router.get('/overdue', requireRole('admin'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoices = await invoiceService.getOverdueInvoices(campusId);
    res.status(200).json(invoices);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/export ───────────────────────────────────────────────────
// Export all campus invoices as CSV.
// Access: admin, executive
router.get('/export', requireRole('admin', 'executive'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const { status } = req.query;

    const invoices = await invoiceService.getAllInvoices({ campusId, status });

    const headers = [
      'reference', 'studentId', 'programmeId', 'description',
      'totalAmount', 'paidAmount', 'scholarshipAmount',
      'dueDate', 'status', 'dunningLevel', 'createdAt',
    ];

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = invoices.map((inv) => headers.map((h) => escape(inv[h])).join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices-export.csv"');
    res.status(200).send(csv);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/student/:studentId ──────────────────────────────────────
// All invoices for a specific student.
// Access: student (own only), admin, executive
router.get('/student/:studentId', requireRole('student', 'admin', 'executive'), async (req, res) => {
  try {
    const { campusId, role, id: userId } = req.user;
    const studentId = parseInt(req.params.studentId, 10);

    if (role === 'student' && studentId !== userId) {
      return res.status(403).json({ message: 'Forbidden: you can only view your own invoices' });
    }

    const invoices = await invoiceService.getInvoicesByStudent(studentId, campusId);
    res.status(200).json(invoices);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/:id ──────────────────────────────────────────────────────
// Single invoice with its payments.
// Access: student (own only), admin, executive
router.get('/:id', requireRole('student', 'admin', 'executive'), async (req, res) => {
  try {
    const { campusId, role, id: userId } = req.user;
    const invoice = await invoiceService.getInvoiceById(parseInt(req.params.id, 10), campusId);

    if (role === 'student' && invoice.studentId !== userId) {
      return res.status(403).json({ message: 'Forbidden: you can only view your own invoices' });
    }

    res.status(200).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── POST /invoices ─────────────────────────────────────────────────────────
// Create a new invoice for a student.
// Access: admin
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const { studentId, programmeId, description, totalAmount, scholarshipAmount, dueDate } = req.body;

    if (!studentId || !description || !totalAmount || !dueDate) {
      return res.status(400).json({ message: 'studentId, description, totalAmount and dueDate are required' });
    }

    const invoice = await invoiceService.createInvoice({
      campusId, studentId, programmeId, description, totalAmount, scholarshipAmount, dueDate,
    });

    await logAuditFromReq(req, {
      action: 'invoice.created',
      entityType: 'invoice',
      entityId: invoice.id,
      diff: { reference: invoice.reference, totalAmount, studentId },
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── PUT /invoices/:id ──────────────────────────────────────────────────────
// Update editable fields of an invoice.
// Access: admin
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoice = await invoiceService.updateInvoice(parseInt(req.params.id, 10), campusId, req.body);

    await logAuditFromReq(req, {
      action: 'invoice.updated',
      entityType: 'invoice',
      entityId: invoice.id,
      diff: req.body,
    });

    res.status(200).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── POST /invoices/:id/dunning ─────────────────────────────────────────────
// Manually advance the dunning level (null → R1 → R2 → R3).
// Access: admin
router.post('/:id/dunning', requireRole('admin'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoice = await invoiceService.advanceDunning(parseInt(req.params.id, 10), campusId);

    await logAuditFromReq(req, {
      action: 'dunning.advanced',
      entityType: 'invoice',
      entityId: invoice.id,
      diff: { dunningLevel: invoice.dunningLevel },
    });

    res.status(200).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── DELETE /invoices/:id ───────────────────────────────────────────────────
// Cancel an invoice (soft delete).
// Access: admin
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoice = await invoiceService.cancelInvoice(parseInt(req.params.id, 10), campusId);

    await logAuditFromReq(req, {
      action: 'invoice.cancelled',
      entityType: 'invoice',
      entityId: invoice.id,
    });

    res.status(200).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
