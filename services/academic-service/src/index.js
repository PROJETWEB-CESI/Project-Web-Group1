require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database.config');
const gradeRoutes = require('./grades/grade.route');
const attendanceRoutes = require('./attendance/attendance.route');
const studentRoutes = require('./students/student.route');
const { authenticate } = require('./middleware/auth.middleware');
require('./config/associations');

const app = express();
const port = process.env.API_PORT || 3000;

// Trust reverse proxy headers (X-Forwarded-Proto, etc.) - needed when behind nginx
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Apply authentication middleware to all service routes
app.use('/grades', authenticate, gradeRoutes);
app.use('/attendance', authenticate, attendanceRoutes);
app.use('/students', authenticate, studentRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await sequelize.sync();
        console.log('Database synced');

        // Seed demo data for test users when ENABLE_TEST_CREDENTIALS (for real data in student pages etc.)
        // This makes /dashboard/student show actual seeded records (grades, attendance, enrollments, etc.)
        // instead of frontend mocks. Idempotent-ish for demo.
        if (process.env.ENABLE_TEST_CREDENTIALS === 'true' || process.env.ENABLE_TEST_CREDENTIALS === '1') {
          const Student = require('./students/student.model');
          const Enrollment = require('./students/enrollment.model');
          const Grade = require('./grades/grade.model');
          const Attendance = require('./attendance/attendance.model');

          // Demo student for test student@test.com (Léa Moreau)
          const demoStudentId = 'STU001';
          const demoCampus = 'CAMP001';

          await Student.findOrCreate({
            where: { studentId: demoStudentId },
            defaults: {
              studentId: demoStudentId,
              firstName: 'Léa',
              lastName: 'Moreau',
              email: 'student@test.com',
              campusId: demoCampus,
              programId: 'PROG001',
              enrollmentYear: 2023,
              status: 'Active',
            },
          });

          // Enrollments for history tab
          await Enrollment.findOrCreate({ where: { enrollmentId: 'ENR001' }, defaults: { enrollmentId: 'ENR001', studentId: demoStudentId, courseId: 'COM101', semester: 1, academicYear: '2023-2024', status: 'En cours', attendanceRate: 96.0, finalGrade: null } });
          await Enrollment.findOrCreate({ where: { enrollmentId: 'ENR002' }, defaults: { enrollmentId: 'ENR002', studentId: demoStudentId, courseId: 'ECO101', semester: 1, academicYear: '2023-2024', status: 'En cours', attendanceRate: 91.5, finalGrade: null } });

          // Grades for grades tab
          const gradesData = [
            { studentId: demoStudentId, courseId: 'COM101', campusId: demoCampus, evaluationName: 'Quiz 1', score: 15, scoreMax: 20, coefficient: 1, evaluationDate: '2023-10-12' },
            { studentId: demoStudentId, courseId: 'COM101', campusId: demoCampus, evaluationName: 'Partiel intermédiaire', score: 13, scoreMax: 20, coefficient: 2, evaluationDate: '2023-11-06' },
            { studentId: demoStudentId, courseId: 'COM101', campusId: demoCampus, evaluationName: 'Cas d\'entreprise', score: 16, scoreMax: 20, coefficient: 1, evaluationDate: '2023-11-22' },
            { studentId: demoStudentId, courseId: 'COM101', campusId: demoCampus, evaluationName: 'Présentation orale', score: 13, scoreMax: 20, coefficient: 2, evaluationDate: '2023-11-28' },
          ];
          for (const g of gradesData) {
            await Grade.findOrCreate({ where: { studentId: g.studentId, courseId: g.courseId, evaluationName: g.evaluationName }, defaults: g });
          }

          // Attendances (absences) for absences tab
          const attData = [
            { studentId: demoStudentId, courseId: 'COM101', campusId: demoCampus, sessionDate: '2023-11-22', status: 'absent', justified: false },
            { studentId: demoStudentId, courseId: 'ECO101', campusId: demoCampus, sessionDate: '2023-11-04', status: 'absent', justified: true, justificationNote: 'certificat médical' },
          ];
          for (const a of attData) {
            await Attendance.findOrCreate({ where: { studentId: a.studentId, courseId: a.courseId, sessionDate: a.sessionDate }, defaults: a });
          }

          console.log('[DEV] Seeded demo academic data for test student STU001 (grades, attendance, enrollments)');
        }

        app.listen(port, () => {
            console.log(`Academic service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
