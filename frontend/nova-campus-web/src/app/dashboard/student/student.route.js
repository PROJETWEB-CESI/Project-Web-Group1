const express = require('express');
const router  = express.Router();
const Student = require('./student.model');
const { verifyToken } = require('../common/utils/jwt.util');

// Middleware: read the access token from the httpOnly cookie (same as IAM service pattern)
function authenticate(req, res, next) {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = verifyToken(token);
    if (!decoded)  return res.status(401).json({ error: 'Invalid or expired session' });

    req.user = decoded; // { id, email, role, campusId }
    next();
}

// GET /api/academic/students/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const student = await Student.findOne({ where: { email: req.user.email } });
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/academic/students/me - only safe user-editable fields
router.patch('/me', authenticate, async (req, res) => {
    try {
        const student = await Student.findOne({ where: { email: req.user.email } });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const allowed = ['first_name', 'last_name', 'phone', 'address'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        await student.update(updates);
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/academic/students/:id (admin use)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/academic/students (admin use)
router.get('/', authenticate, async (req, res) => {
    try {
        const students = await Student.findAll();
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
