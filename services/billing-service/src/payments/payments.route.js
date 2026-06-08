const express = require('express');
const router = express.Router();
const paymentService = require('./payments.service');

// ─── GET /payments/invoices/:invoiceId ──────────────────────────────────────
// List all payments for a given invoice.
// Access: student (own), admin
router.get('/invoices/:invoiceId', async (req, res) => {
  try {
    const { campusId } = req.user;
    const invoiceId = parseInt(req.params.invoiceId, 10);
    const payments = await paymentService.getPaymentsByInvoice(invoiceId, campusId);
    res.status(200).json(payments);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /payments/:id ─────────────────────────────────────────────────────
// Return a single payment record.
// Access: admin
router.get('/:id', async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(parseInt(req.params.id, 10));
    res.status(200).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── POST /payments ────────────────────────────────────────────────────────
// Record a new payment against an invoice.
// Automatically updates the invoice's paidAmount and status.
// Access: admin
router.post('/', async (req, res) => {
  try {
    const { campusId } = req.user;
    const { invoiceId, amount, method, transactionReference, notes, paidAt } = req.body;

    if (!invoiceId || !amount || !method) {
      return res.status(400).json({ message: 'invoiceId, amount and method are required' });
    }

    const payment = await paymentService.recordPayment({
      invoiceId,
      campusId,
      amount,
      method,
      transactionReference,
      notes,
      paidAt,
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── PATCH /payments/:id/status ────────────────────────────────────────────
// Update the status of a payment (e.g. mark as refunded or failed).
// When refunding a completed payment, invoice.paidAmount is automatically reduced.
// Access: admin
router.patch('/:id/status', async (req, res) => {
  try {
    const { campusId } = req.user;
    const { status } = req.body;

    const allowed = ['completed', 'pending', 'failed', 'refunded'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }

    const payment = await paymentService.updatePaymentStatus(
      parseInt(req.params.id, 10),
      campusId,
      status
    );

    res.status(200).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
