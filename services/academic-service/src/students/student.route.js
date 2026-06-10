const express = require('express');
const router = express.Router();
const service = require('./student.service');
const { authorize } = require('../middleware/auth.middleware');

// Admin : liste des étudiants d'un campus avec filtres optionnels
router.get('/', authorize(['admin']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const students = await service.getStudents(req.query.campusId, {
            programmeId: req.query.programmeId,
            administrativeStatus: req.query.administrativeStatus,
            search: req.query.search,
        });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student/Teacher/Admin : profil d'un étudiant (students can view their own, teachers/admins can view any)
router.get('/:id', authorize(['student', 'teacher', 'admin']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const student = await service.getStudentById(req.params.id, req.query.campusId);
        if (!student) return res.status(404).json({ error: 'Étudiant introuvable' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin : créer un dossier étudiant
router.post('/', authorize(['admin']), async (req, res) => {
    const { userId, campusId, studentNumber, firstName, lastName, email, programmeId, entryYear } = req.body;
    if (!userId || !campusId || !studentNumber || !firstName || !lastName || !email || !programmeId || !entryYear) {
        return res.status(400).json({ error: 'Champs obligatoires manquants : userId, campusId, studentNumber, firstName, lastName, email, programmeId, entryYear' });
    }
    try {
        const student = await service.createStudent(req.body);
        res.status(201).json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Student/Teacher/Admin : historique des inscriptions d'un étudiant
router.get('/:studentId/enrollments', authorize(['student', 'teacher', 'admin']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const enrollments = await service.getEnrollmentsByStudent(req.params.studentId, req.query.campusId);
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin : inscrire un étudiant à un cours
router.post('/:studentId/enrollments', authorize(['admin']), async (req, res) => {
    const { courseId, campusId, semester, academicYear } = req.body;
    if (!courseId || !campusId || !semester || !academicYear) {
        return res.status(400).json({ error: 'Champs obligatoires manquants : courseId, campusId, semester, academicYear' });
    }
    try {
        const enrollment = await service.createEnrollment({ ...req.body, studentId: req.params.studentId });
        res.status(201).json(enrollment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin/prof : mettre à jour une inscription (note, présence, statut)
router.put('/enrollments/:id', authorize(['admin', 'teacher']), async (req, res) => {
    try {
        const enrollment = await service.updateEnrollment(req.params.id, req.body);
        if (!enrollment) return res.status(404).json({ error: 'Inscription introuvable' });
        res.json(enrollment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin/étudiant : mettre à jour un profil
router.put('/:id', authorize(['admin', 'student']), async (req, res) => {
    if (!req.query.campusId) {
        return res.status(400).json({ error: 'campusId est obligatoire' });
    }
    try {
        const student = await service.updateStudent(req.params.id, req.query.campusId, req.body);
        if (!student) return res.status(404).json({ error: 'Étudiant introuvable' });
        res.json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
