const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { authorize } = require('../middleware/auth.middleware');
const Enrollment = require('../students/enrollment.model');
const Grade = require('../grades/grade.model');
const Course = require('../courses/course.model');
const { getCourseGradeStats } = require('../grades/grade.service');

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

// Teacher/Admin: list courses that have unpublished grades
router.get('/courses/pending-grades', authorize(['teacher', 'admin']), async (req, res) => {
  const { courseIds, campusId } = req.query;
  if (!courseIds || !campusId) {
    return res.status(400).json({ error: 'courseIds and campusId are required' });
  }

  const courseIdList = courseIds.split(',').map(s => s.trim()).filter(Boolean);
  if (courseIdList.length === 0) return res.json([]);

  try {
    const unpublished = await Grade.findAll({
      where: { courseId: { [Op.in]: courseIdList }, campusId, publishedAt: null },
      attributes: ['courseId'],
    });

    if (unpublished.length === 0) return res.json([]);

    const countMap = {};
    for (const g of unpublished) {
      countMap[g.courseId] = (countMap[g.courseId] || 0) + 1;
    }

    const pendingCourseIds = Object.keys(countMap);
    const courses = await Course.findAll({
      where: { courseId: { [Op.in]: pendingCourseIds } },
      attributes: ['courseId', 'courseName'],
    });
    const nameMap = Object.fromEntries(courses.map(c => [c.courseId, c.courseName]));

    const result = pendingCourseIds.map(id => ({
      courseId: id,
      courseName: nameMap[id] || id,
      unpublishedCount: countMap[id],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher/Admin: grade performance stats per course (average, passRate, count)
router.get('/courses/performance', authorize(['teacher', 'admin']), async (req, res) => {
  const { courseIds, campusId } = req.query;
  if (!courseIds || !campusId) {
    return res.status(400).json({ error: 'courseIds and campusId are required' });
  }

  const courseIdList = courseIds.split(',').map(s => s.trim()).filter(Boolean);
  if (courseIdList.length === 0) return res.json([]);

  try {
    const courses = await Course.findAll({
      where: { courseId: { [Op.in]: courseIdList } },
      attributes: ['courseId', 'courseName'],
    });
    const nameMap = Object.fromEntries(courses.map(c => [c.courseId, c.courseName]));

    const results = await Promise.all(
      courseIdList.map(async (id) => {
        const stats = await getCourseGradeStats(id, campusId);
        return { courseId: id, courseName: nameMap[id] || id, ...stats };
      })
    );

    res.json(results.filter(r => r.studentsCount > 0));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
