const express = require('express');
const router = express.Router();
const service = require('./attendance.service');

// Prof : justifier une absence — déclaré avant /:id pour éviter un conflit de routing
router.post('/:id/justify', async (req, res) => {
    if (!req.body.justificationNote) {
        return res.status(400).json({ error: 'justificationNote est obligatoire' });
    }
    try {
        const record = await service.justifyAbsence(req.params.id, req.body.justificationNote);
        if (!record) return res.status(404).json({ error: 'Enregistrement introuvable' });
        res.json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Prof : enregistrer l'appel d'une session entière
router.post('/session', async (req, res) => {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'records doit être un tableau non vide' });
    }
    try {
        const result = await service.markAttendance(records);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Prof/admin : présences d'une session (cours + date)
router.get('/course/:courseId', async (req, res) => {
    const { campusId, sessionDate } = req.query;
    if (!campusId || !sessionDate) {
        return res.status(400).json({ error: 'campusId et sessionDate sont obligatoires' });
    }
    try {
        const records = await service.getAttendanceByCourse(req.params.courseId, campusId, sessionDate);
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Étudiant : son historique de présences
router.get('/student/:studentId', async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const records = await service.getAttendanceByStudent(req.params.studentId, req.query.campusId);
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Prof : modifier un enregistrement de présence
router.put('/:id', async (req, res) => {
    try {
        const record = await service.updateAttendance(req.params.id, req.body);
        if (!record) return res.status(404).json({ error: 'Enregistrement introuvable' });
        res.json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
