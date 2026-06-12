const express = require('express');
const router = express.Router();
const service = require('./retention.service');

// Résumé global groupe : total étudiants, abandons, taux d'abandon
// GET /api/retention/summary
router.get('/summary', async (req, res) => {
    try {
        const data = await service.getGroupSummary();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rétention par cohorte (année d'entrée) — ?campusId= optionnel
// GET /api/retention/cohorts
router.get('/cohorts', async (req, res) => {
    try {
        const data = await service.getCohortRetention(req.query.campusId || null);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Taux d'abandon par campus
// GET /api/retention/dropout
router.get('/dropout', async (req, res) => {
    try {
        const data = await service.getDropoutByCampus();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
