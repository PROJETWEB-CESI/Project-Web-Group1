const express = require('express');
const router = express.Router();
const service = require('./programme.service');

// KPIs de tous les programmes — ?campusId= optionnel pour filtrer par campus
// GET /api/programmes
router.get('/', async (req, res) => {
    try {
        const data = await service.getAllProgrammeStats(req.query.campusId || null);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// KPIs d'un programme précis — ?campusId= optionnel
// GET /api/programmes/:programmeId
router.get('/:programmeId', async (req, res) => {
    try {
        const data = await service.getProgrammeStats(req.params.programmeId, req.query.campusId || null);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
