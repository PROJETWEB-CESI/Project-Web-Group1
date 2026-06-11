const express = require('express');
const { query, validationResult, matchedData } = require('express-validator');
const router = express.Router();
const service = require('./payment.service');
const { authorize } = require('../middleware/auth.middleware');

// ── Student routes ────────────────────────────────────────────────────────────

// Étudiant : résumé de facturation (solde, payé, impayé, prochaine échéance)
router.get('/student/:studentId/summary', authorize(['student', 'admin']), async (req, res) => {
    try {
        const summary = await service.getStudentBillingSummary(
            req.params.studentId,
            req.query.academicYear
        );
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Étudiant : liste complète de ses paiements
router.get('/student/:studentId', authorize(['student', 'admin']), async (req, res) => {
    try {
        const payments = await service.getPaymentsByStudent(req.params.studentId);
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin routes ──────────────────────────────────────────────────────────────

// Admin : KPIs de facturation d'un campus
// GET /api/payments/stats?campusId=CAMP001&academicYear=2023-2024
router.get('/stats', authorize(['admin', 'executive']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const stats = await service.getCampusBillingStats(
            req.query.campusId,
            req.query.academicYear
        );
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin/exécutif : impayés par campus (tous les campus)
// GET /api/payments/overdue/all
router.get('/overdue/all', authorize(['admin', 'executive']), async (req, res) => {
    try {
        const data = await service.getOverdueByAllCampuses();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin : impayés d'un campus avec classification R1/R2/R3
// GET /api/payments/overdue?campusId=CAMP001
router.get('/overdue', authorize(['admin']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const overdue = await service.getOverduePayments(req.query.campusId);
        res.json(overdue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin : liste des paiements d'un campus avec filtres
// GET /api/payments?campusId=CAMP001&status=Delay&academicYear=2023-2024&semester=1&search=dupont
router.get('/', authorize(['admin']), query('search').optional().isString(), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { search } = matchedData(req, { locations: ['query'] });
        const payments = await service.getPaymentsByCampus(req.query.campusId, {
            status:       req.query.status,
            academicYear: req.query.academicYear,
            semester:     req.query.semester ? parseInt(req.query.semester, 10) : undefined,
            search,
        });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin : détail d'un paiement
router.get('/:paymentId', authorize(['admin']), async (req, res) => {
    try {
        const payment = await service.getPaymentById(req.params.paymentId);
        if (!payment) return res.status(404).json({ error: 'Paiement introuvable' });
        res.json(payment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin : créer une facture
router.post('/', authorize(['admin']), async (req, res) => {
    const { paymentId, studentId, amount, dueDate, academicYear } = req.body;
    if (!paymentId || !studentId || !amount || !dueDate || !academicYear) {
        return res.status(400).json({
            error: 'Champs obligatoires : paymentId, studentId, amount, dueDate, academicYear',
        });
    }
    try {
        const payment = await service.createPayment(req.body);
        res.status(201).json(payment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin : mettre à jour un paiement (marquer comme payé, changer le statut, etc.)
router.put('/:paymentId', authorize(['admin']), async (req, res) => {
    try {
        const payment = await service.updatePayment(req.params.paymentId, req.body);
        if (!payment) return res.status(404).json({ error: 'Paiement introuvable' });
        res.json(payment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin : supprimer une facture
router.delete('/:paymentId', authorize(['admin']), async (req, res) => {
    try {
        const result = await service.deletePayment(req.params.paymentId);
        if (!result) return res.status(404).json({ error: 'Paiement introuvable' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
