const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { authorize } = require('../middleware/auth.middleware');
const Enrollment = require('../students/enrollment.model');
const Grade = require('../grades/grade.model');
const Course = require('../courses/course.model');
const { getCourseGradeStats } = require('../grades/grade.service');
const Student = require('../students/student.model');
const Program = require('../students/program.model');

// Teacher/Admin: students enrolled in a course with attendance + grades
router.get('/courses/:courseId/students', authorize(['teacher', 'admin']), async (req, res) => {
  const { courseId } = req.params;
  const { campusId } = req.query;
  if (!campusId) return res.status(400).json({ error: 'campusId is required' });

  try {
    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [{
        model: Student,
        as: 'student',
        where: { campusId },
        attributes: ['studentId', 'firstName', 'lastName', 'enrollmentYear'],
        include: [{ model: Program, as: 'program', attributes: ['programName'] }],
      }],
    });

    if (enrollments.length === 0) return res.json([]);

    const studentIds = enrollments.map(e => e.studentId);
    const grades = await Grade.findAll({
      where: { courseId, campusId, studentId: { [Op.in]: studentIds } },
      attributes: ['studentId', 'evaluationName', 'score', 'scoreMax', 'coefficient', 'publishedAt', 'evaluationDate'],
      order: [['evaluationDate', 'ASC']],
    });

    const gradesByStudent = {};
    for (const g of grades) {
      if (!gradesByStudent[g.studentId]) gradesByStudent[g.studentId] = [];
      gradesByStudent[g.studentId].push(g);
    }

    const result = enrollments.map(e => {
      const s = e.student;
      const studentGrades = gradesByStudent[e.studentId] || [];
      const published = studentGrades.filter(g => g.publishedAt !== null);
      const weightedSum = published.reduce((sum, g) => sum + parseFloat(g.score || 0) * g.coefficient, 0);
      const totalCoeff  = published.reduce((sum, g) => sum + g.coefficient, 0);
      const average = totalCoeff > 0 ? +(weightedSum / totalCoeff).toFixed(2) : null;

      return {
        studentId:      e.studentId,
        firstName:      s?.firstName || null,
        lastName:       s?.lastName  || null,
        program:        s?.program?.programName || null,
        enrollmentYear: s?.enrollmentYear || null,
        attendanceRate: e.attendanceRate != null ? parseFloat(e.attendanceRate) : null,
        average,
        grades: studentGrades.map(g => ({
          evaluationName: g.evaluationName,
          score:          g.score != null ? parseFloat(g.score) : null,
          scoreMax:       g.scoreMax,
          coefficient:    g.coefficient,
          publishedAt:    g.publishedAt,
          evaluationDate: g.evaluationDate,
        })),
      };
    });

    result.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Teacher/Admin: grade score distribution per course
router.get('/courses/distribution', authorize(['teacher', 'admin']), async (req, res) => {
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
        const grades = await Grade.findAll({
          where: { courseId: id, campusId, score: { [Op.not]: null } },
          attributes: ['score'],
        });
        const scores = grades.map(g => parseFloat(g.score));
        if (scores.length === 0) return null;

        const buckets = [
          { range: '0–5',   min: 0,  max: 5  },
          { range: '5–10',  min: 5,  max: 10 },
          { range: '10–14', min: 10, max: 14 },
          { range: '14–20', min: 14, max: 20 },
        ];
        const distribution = buckets.map(b => ({
          range: b.range,
          count: scores.filter(s => s >= b.min && s < (b.max === 20 ? 20.01 : b.max)).length,
        }));

        return { courseId: id, courseName: nameMap[id] || id, distribution };
      })
    );

    res.json(results.filter(Boolean));
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
