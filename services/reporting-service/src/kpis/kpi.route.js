const express = require('express');
const router = express.Router();
const service = require('./kpi.service');

// KPIs d'un campus précis
// GET /api/kpis/campus/:campusId
router.get('/campus/:campusId', async (req, res) => {
    try {
        const data = await service.getCampusKpis(req.params.campusId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// KPIs de tous les campus (tableau de bord exécutif)
// GET /api/kpis/campus
router.get('/campus', async (req, res) => {
    try {
        const data = await service.getAllCampusKpis();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
