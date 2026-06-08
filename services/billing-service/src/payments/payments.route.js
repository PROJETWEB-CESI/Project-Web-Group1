const express = require('express');
const router = express.Router();
const paymentService = require('./payments.service');
const Invoice = require('../invoices/invoices.model');
const { requireRole } = require('../middleware/rbac.middleware');
const { logAuditFromReq } = require('../audit/audit.service');

// ─── GET /payments/invoices/:invoiceId ──────────────────────────────────────
// All payments for a given invoice.
// Access: student (own invoice only), admin
router.get('/invoices/:invoiceId', requireRole('student', 'admin'), async (req, res) => {
  try {
    const { campusId, role, id: userId } = req.user;
    const invoiceId = parseInt(req.params.invoiceId, 10);

    // Students may only see payments for their own invoices
    if (role === 'student') {
      const invoice = await Invoice.findOne({ where: { id: invoiceId, studentId: userId, campusId } });
      if (!invoice) {
        return res.status(403).json({ message: 'Forbidden: you can only view your own payment records' });
      }
    }

    const payments = await paymentService.getPaymentsByInvoice(invoiceId, campusId);
    res.status(200).json(payments);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── GET /payments/:id ──────────────────────────────────────────────────────
// Single payment record.
// Access: admin
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(parseInt(req.params.id, 10));
    res.status(200).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── POST /payments ─────────────────────────────────────────────────────────
// Record a new payment against an invoice.
// Access: admin
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { campusId } = req.user;
    const { invoiceId, amount, method, transactionReference, notes, paidAt } = req.body;

    if (!invoiceId || !amount || !method) {
      return res.status(400).json({ message: 'invoiceId, amount and method are required' });
    }

    const payment = await paymentService.recordPayment({
      invoiceId, campusId, amount, method, transactionReference, notes, paidAt,
    });

    await logAuditFromReq(req, {
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: payment.id,
      diff: { invoiceId, amount, method },
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// ─── PATCH /payments/:id/status ─────────────────────────────────────────────
// Update payment status (e.g. mark as refunded or failed).
// Access: admin
router.patch('/:id/status', requireRole('admin'), async (req, res) => {
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

    await logAuditFromReq(req, {
      action: 'payment.status_updated',
      entityType: 'payment',
      entityId: payment.id,
      diff: { status },
    });

    res.status(200).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
