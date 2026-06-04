const express = require('express');
const router = express.Router();
const service = require('./grade.service');

// Prof/admin : publier toutes les notes d'un cours
router.post('/course/:courseId/publish', async (req, res) => {
    if (!req.body.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const count = await service.publishGrades(req.params.courseId, req.body.campusId);
        res.json({ published: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Prof/admin : toutes les notes d'un cours
router.get('/course/:courseId', async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const grades = await service.getGradesByCourse(req.params.courseId, req.query.campusId);
        res.json(grades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Étudiant : ses notes publiées
router.get('/student/:studentId', async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const grades = await service.getGradesByStudent(req.params.studentId, req.query.campusId);
        res.json(grades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Prof/admin : saisir une note
router.post('/', async (req, res) => {
    const { studentId, courseId, campusId, evaluationName, evaluationDate, coefficient } = req.body;
    if (!studentId || !courseId || !campusId || !evaluationName || !evaluationDate || !coefficient) {
        return res.status(400).json({ error: 'Champs obligatoires manquants : studentId, courseId, campusId, evaluationName, evaluationDate, coefficient' });
    }
    try {
        const grade = await service.createGrade(req.body);
        res.status(201).json(grade);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Prof/admin : modifier une note
router.put('/:id', async (req, res) => {
    try {
        const grade = await service.updateGrade(req.params.id, req.body);
        if (!grade) return res.status(404).json({ error: 'Note introuvable' });
        res.json(grade);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Prof/admin : supprimer une note
router.delete('/:id', async (req, res) => {
    try {
        const result = await service.deleteGrade(req.params.id);
        if (!result) return res.status(404).json({ error: 'Note introuvable' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
