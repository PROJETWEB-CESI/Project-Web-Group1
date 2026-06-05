const express = require('express');
const router = express.Router();
const service = require('./comparison.service');

// Comparaison inter-campus avec moyennes du groupe
// GET /api/comparison
router.get('/', async (req, res) => {
    try {
        const data = await service.getCampusComparison();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tendance des effectifs par campus et par année d'entrée
// GET /api/comparison/trend
router.get('/trend', async (req, res) => {
    try {
        const data = await service.getEnrollmentTrend();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
