const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { authorize } = require('../middleware/auth.middleware');
const Enrollment = require('../students/enrollment.model');

// Teacher/Admin: aggregate stats (student count + avg attendance) across a list of courses
router.get('/courses/stats', authorize(['teacher', 'admin']), async (req, res) => {
  const { courseIds, campusId } = req.query;
  if (!courseIds || !campusId) {
    return res.status(400).json({ error: 'courseIds and campusId are required' });
  }

  const courseIdList = courseIds.split(',').map(s => s.trim()).filter(Boolean);
  if (courseIdList.length === 0) {
    return res.json({ studentsCount: 0, avgAttendanceRate: null });
  }

  try {
    const enrollments = await Enrollment.findAll({
      where: { courseId: { [Op.in]: courseIdList } },
    });

    const uniqueStudents = new Set(enrollments.map(e => e.studentId));
    const studentsCount = uniqueStudents.size;

    const rates = enrollments
      .map(e => parseFloat(e.attendanceRate))
      .filter(r => !isNaN(r));

    const avgAttendanceRate = rates.length > 0
      ? +(rates.reduce((sum, r) => sum + r, 0) / rates.length).toFixed(1)
      : null;

    res.json({ studentsCount, avgAttendanceRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
