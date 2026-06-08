const express = require('express');
const router = express.Router();
const invoiceService = require('./invoices.service');

// ─── GET /invoices ─────────────────────────────────────────────────────────
// List all invoices for a campus. Query params: ?status=&studentId=
// Access: admin, executive
router.get('/', async (req, res) => {
  try {
    const { campusId } = req.user;
    const { status, studentId } = req.query;

    const invoices = await invoiceService.getAllInvoices({
      campusId,
      status,
      studentId: studentId ? parseInt(studentId, 10) : undefined,
    });

    res.status(200).json(invoices);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/summary ─────────────────────────────────────────────────
// Aggregate billing figures for the campus dashboard.
// Access: admin, executive
router.get('/summary', async (req, res) => {
  try {
    const { campusId } = req.user;
    const summary = await invoiceService.getBillingSummary(campusId);
    res.status(200).json(summary);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/overdue ─────────────────────────────────────────────────
// List invoices past their due date that are still unpaid.
// Access: admin
router.get('/overdue', async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoices = await invoiceService.getOverdueInvoices(campusId);
    res.status(200).json(invoices);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/student/:studentId ──────────────────────────────────────
// Return all invoices for a specific student.
// Access: student (own), admin
router.get('/student/:studentId', async (req, res) => {
  try {
    const { campusId } = req.user;
    const studentId = parseInt(req.params.studentId, 10);
    const invoices = await invoiceService.getInvoicesByStudent(studentId, campusId);
    res.status(200).json(invoices);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /invoices/:id ─────────────────────────────────────────────────────
// Return a single invoice with its payments.
// Access: student (own), admin
router.get('/:id', async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoice = await invoiceService.getInvoiceById(parseInt(req.params.id, 10), campusId);
    res.status(200).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── POST /invoices ────────────────────────────────────────────────────────
// Create a new invoice for a student.
// Access: admin
router.post('/', async (req, res) => {
  try {
    const { campusId } = req.user;
    const { studentId, description, totalAmount, scholarshipAmount, dueDate } = req.body;

    if (!studentId || !description || !totalAmount || !dueDate) {
      return res.status(400).json({ message: 'studentId, description, totalAmount and dueDate are required' });
    }

    const invoice = await invoiceService.createInvoice({
      campusId,
      studentId,
      description,
      totalAmount,
      scholarshipAmount,
      dueDate,
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── PUT /invoices/:id ─────────────────────────────────────────────────────
// Update editable fields of an invoice (description, dueDate, notes, status).
// Access: admin
router.put('/:id', async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoice = await invoiceService.updateInvoice(parseInt(req.params.id, 10), campusId, req.body);
    res.status(200).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── POST /invoices/:id/dunning ────────────────────────────────────────────
// Advance the dunning level of an overdue invoice (null → R1 → R2 → R3).
// Access: admin
router.post('/:id/dunning', async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoice = await invoiceService.advanceDunning(parseInt(req.params.id, 10), campusId);
    res.status(200).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── DELETE /invoices/:id ──────────────────────────────────────────────────
// Cancel an invoice (soft delete — sets status to 'cancelled').
// Access: admin
router.delete('/:id', async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoice = await invoiceService.cancelInvoice(parseInt(req.params.id, 10), campusId);
    res.status(200).json(invoice);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
