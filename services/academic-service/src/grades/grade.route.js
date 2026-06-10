const express = require('express');
const multer = require('multer');
const router = express.Router();
const service = require('./grade.service');
const { parseGradesCsv } = require('../common/utils/csv.util');
const { resolveStudentId } = require('../common/utils/student.util');
const { authorize } = require('../middleware/auth.middleware');

// Multer stocke le fichier en mémoire (pas sur le disque)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
        else cb(new Error('Seuls les fichiers .csv sont acceptés'));
    },
});

// Prof : publier toutes les notes d'un cours — déclaré avant les routes génériques
router.post('/course/:courseId/publish', authorize(['teacher', 'admin']), async (req, res) => {
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

// Prof : distribution des notes d'un cours (médiane, écart-type, taux de réussite)
router.get('/course/:courseId/stats', authorize(['teacher', 'admin']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const stats = await service.getCourseGradeStats(req.params.courseId, req.query.campusId);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Prof : import d'un fichier CSV de notes pour un cours
// Champs attendus dans le CSV : studentId, evaluationName, score, coefficient, evaluationDate
// Le champ annotation est optionnel
router.post('/course/:courseId/import', authorize(['teacher', 'admin']), (req, res, next) => {
    upload.single('file')(req, res, err => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res) => {
    if (!req.body.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire (dans le body du formulaire)' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'Un fichier CSV est obligatoire (champ : file)' });
    }
    try {
        const grades = parseGradesCsv(req.file.buffer);
        const records = grades.map(g => ({ ...g, courseId: req.params.courseId, campusId: req.body.campusId }));
        const created = await Promise.all(records.map(r => service.createGrade(r)));
        res.status(201).json({ imported: created.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Prof/admin : toutes les notes d'un cours
router.get('/course/:courseId', authorize(['teacher', 'admin']), async (req, res) => {
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

// Étudiant : moyenne pondérée, rang dans la promo, moyenne de classe
router.get('/student/:studentId/stats', authorize(['student', 'teacher', 'admin']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const stats = await service.getStudentGradeStats(req.params.studentId, req.query.campusId, req.query.courseId);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Étudiant : ses notes publiées
router.get('/student/:studentId', authorize(['student', 'teacher', 'admin']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const studentId = await resolveStudentId(req.params.studentId);
        const grades = await service.getGradesByStudent(studentId, req.query.campusId);
        res.json(grades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Prof : saisir une note
router.post('/', authorize(['teacher', 'admin']), async (req, res) => {
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

// Prof : modifier une note
router.put('/:id', authorize(['teacher', 'admin']), async (req, res) => {
    try {
        const grade = await service.updateGrade(req.params.id, req.body);
        if (!grade) return res.status(404).json({ error: 'Note introuvable' });
        res.json(grade);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Prof : supprimer une note
router.delete('/:id', authorize(['teacher', 'admin']), async (req, res) => {
    try {
        const result = await service.deleteGrade(req.params.id);
        if (!result) return res.status(404).json({ error: 'Note introuvable' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
