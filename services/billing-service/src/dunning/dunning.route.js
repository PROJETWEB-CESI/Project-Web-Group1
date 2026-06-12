const express = require('express');
const router = express.Router();
const service = require('./dunning.service');
const { authorize } = require('../middleware/auth.middleware');

// Admin : aperçu du workflow de relance (aucune écriture en base)
// GET /api/dunning/preview?campusId=CAMP001
router.get('/preview', authorize(['admin']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const preview = await service.previewDunning(req.query.campusId);
        res.json(preview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin : exécuter le workflow de relance automatique R1/R2/R3
// POST /api/dunning/run   body: { campusId }
router.post('/run', authorize(['admin']), async (req, res) => {
    if (!req.body.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const result = await service.runDunning(req.body.campusId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin : déclencher une relance manuelle sur un paiement précis
// POST /api/dunning/:paymentId/remind   body: { stage? }  (stage facultatif : auto-détecté si absent)
router.post('/:paymentId/remind', authorize(['admin']), async (req, res) => {
    try {
        const result = await service.remindOne(req.params.paymentId, req.body.stage);
        if (!result) return res.status(404).json({ error: 'Paiement introuvable' });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
