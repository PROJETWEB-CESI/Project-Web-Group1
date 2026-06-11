require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database.config');
const gradeRoutes = require('./grades/grade.route');
const attendanceRoutes = require('./attendance/attendance.route');
const studentRoutes = require('./students/student.route');
const { authenticate } = require('./middleware/auth.middleware');
const { csrfProtection } = require('./middleware/csrf.middleware');
require('./config/associations');

const app = express();
app.disable('x-powered-by');
const port = process.env.API_PORT || 3000;

// Trust reverse proxy headers (X-Forwarded-Proto, etc.) - needed when behind nginx
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);

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
              firstName: 'Alexandre',
              lastName: 'Dubois',
              email: 'a.dubois@etu.novacampus.fr',
              campusId: demoCampus,
              programId: 'PROG001',
              enrollmentYear: 2023,
              status: 'Active',
            },
          });

          // ── Enrollments — 5 semestres ────────────────────────────────────────
          const enrollments = [
            // S1 2023-2024
            { enrollmentId: 'DEMO_E01', studentId: demoStudentId, courseId: 'CRS001', semester: 1, academicYear: '2023-2024', status: 'Validated', attendanceRate: 95.0, finalGrade: 13.83 },
            { enrollmentId: 'DEMO_E02', studentId: demoStudentId, courseId: 'CRS003', semester: 1, academicYear: '2023-2024', status: 'Validated', attendanceRate: 88.0, finalGrade: 12.50 },
            // S2 2023-2024
            { enrollmentId: 'DEMO_E03', studentId: demoStudentId, courseId: 'CRS004', semester: 2, academicYear: '2023-2024', status: 'Validated', attendanceRate: 92.0, finalGrade: 12.75 },
            { enrollmentId: 'DEMO_E04', studentId: demoStudentId, courseId: 'CRS008', semester: 2, academicYear: '2023-2024', status: 'Validated', attendanceRate: 90.0, finalGrade: 14.00 },
            // S1 2024-2025
            { enrollmentId: 'DEMO_E05', studentId: demoStudentId, courseId: 'CRS005', semester: 1, academicYear: '2024-2025', status: 'Validated', attendanceRate: 96.0, finalGrade: 13.25 },
            { enrollmentId: 'DEMO_E06', studentId: demoStudentId, courseId: 'CRS009', semester: 1, academicYear: '2024-2025', status: 'Validated', attendanceRate: 91.0, finalGrade: 14.50 },
            // S2 2024-2025
            { enrollmentId: 'DEMO_E07', studentId: demoStudentId, courseId: 'CRS007', semester: 2, academicYear: '2024-2025', status: 'Validated', attendanceRate: 94.0, finalGrade: 14.25 },
            { enrollmentId: 'DEMO_E08', studentId: demoStudentId, courseId: 'CRS010', semester: 2, academicYear: '2024-2025', status: 'Validated', attendanceRate: 89.0, finalGrade: 13.00 },
            // S1 2025-2026 — semestre en cours
            { enrollmentId: 'DEMO_E09', studentId: demoStudentId, courseId: 'CRS002', semester: 1, academicYear: '2025-2026', status: 'In Progress', attendanceRate: 96.0, finalGrade: null },
            { enrollmentId: 'DEMO_E10', studentId: demoStudentId, courseId: 'CRS006', semester: 1, academicYear: '2025-2026', status: 'In Progress', attendanceRate: 100.0, finalGrade: null },
          ];
          for (const e of enrollments) {
            try {
              await Enrollment.findOrCreate({
                where: { studentId: e.studentId, courseId: e.courseId, academicYear: e.academicYear },
                defaults: e,
              });
            } catch (err) {
              // ignore conflicts from other seeds
            }
          }

          // ── Grades publiées — 5 semestres ───────────────────────────────────
          const now = new Date();
          const gradesData = [
            // S1 2023-2024 — CRS001
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, evaluationName: 'Quiz 1', score: 15, scoreMax: 20, coefficient: 1, evaluationDate: '2023-10-12', publishedAt: now },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, evaluationName: 'Partiel intermédiaire', score: 13, scoreMax: 20, coefficient: 2, evaluationDate: '2023-11-06', publishedAt: now },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, evaluationName: 'Cas d\'entreprise', score: 16, scoreMax: 20, coefficient: 1, evaluationDate: '2023-11-22', publishedAt: now },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, evaluationName: 'Présentation orale', score: 13, scoreMax: 20, coefficient: 2, evaluationDate: '2023-11-28', publishedAt: now },
            // S1 2023-2024 — CRS003
            { studentId: demoStudentId, courseId: 'CRS003', campusId: demoCampus, evaluationName: 'TP Python 1', score: 14, scoreMax: 20, coefficient: 1, evaluationDate: '2023-10-20', publishedAt: now },
            { studentId: demoStudentId, courseId: 'CRS003', campusId: demoCampus, evaluationName: 'Projet final', score: 11, scoreMax: 20, coefficient: 2, evaluationDate: '2023-12-01', publishedAt: now },
            // S2 2023-2024 — CRS004
            { studentId: demoStudentId, courseId: 'CRS004', campusId: demoCampus, evaluationName: 'Partiel S2', score: 12, scoreMax: 20, coefficient: 2, evaluationDate: '2024-03-15', publishedAt: now },
            { studentId: demoStudentId, courseId: 'CRS004', campusId: demoCampus, evaluationName: 'Projet marketing', score: 13.5, scoreMax: 20, coefficient: 2, evaluationDate: '2024-05-20', publishedAt: now },
            // S2 2023-2024 — CRS008
            { studentId: demoStudentId, courseId: 'CRS008', campusId: demoCampus, evaluationName: 'Examen Éco Int.', score: 14, scoreMax: 20, coefficient: 2, evaluationDate: '2024-05-10', publishedAt: now },
            // S1 2024-2025 — CRS005
            { studentId: demoStudentId, courseId: 'CRS005', campusId: demoCampus, evaluationName: 'QCM IA', score: 11, scoreMax: 20, coefficient: 1, evaluationDate: '2024-10-10', publishedAt: now },
            { studentId: demoStudentId, courseId: 'CRS005', campusId: demoCampus, evaluationName: 'Projet IA', score: 14, scoreMax: 20, coefficient: 3, evaluationDate: '2024-11-25', publishedAt: now },
            // S1 2024-2025 — CRS009
            { studentId: demoStudentId, courseId: 'CRS009', campusId: demoCampus, evaluationName: 'Examen droit', score: 14.5, scoreMax: 20, coefficient: 2, evaluationDate: '2024-12-10', publishedAt: now },
            // S2 2024-2025 — CRS007
            { studentId: demoStudentId, courseId: 'CRS007', campusId: demoCampus, evaluationName: 'Analyse exploratoire', score: 13.5, scoreMax: 20, coefficient: 2, evaluationDate: '2025-03-12', publishedAt: now },
            { studentId: demoStudentId, courseId: 'CRS007', campusId: demoCampus, evaluationName: 'Rapport final data', score: 15, scoreMax: 20, coefficient: 2, evaluationDate: '2025-05-20', publishedAt: now },
            // S2 2024-2025 — CRS010
            { studentId: demoStudentId, courseId: 'CRS010', campusId: demoCampus, evaluationName: 'Projet web', score: 13, scoreMax: 20, coefficient: 2, evaluationDate: '2025-05-15', publishedAt: now },
            // S1 2025-2026 — CRS002 (en cours, publiées)
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, evaluationName: 'TD noté maths', score: 14, scoreMax: 20, coefficient: 1, evaluationDate: '2025-10-15', publishedAt: now },
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, evaluationName: 'Partiel mi-semestre', score: 15.5, scoreMax: 20, coefficient: 2, evaluationDate: '2025-11-05', publishedAt: now },
          ];
          for (const g of gradesData) {
            try {
              await Grade.findOrCreate({
                where: { studentId: g.studentId, courseId: g.courseId, evaluationName: g.evaluationName },
                defaults: g,
              });
            } catch (err) {
              // ignore conflicts
            }
          }

          // ── Présences — sessions pour un taux réaliste ──────────────────────
          const attData = [
            // Présences normales
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, sessionDate: '2023-10-02', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, sessionDate: '2023-10-09', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, sessionDate: '2023-10-16', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, sessionDate: '2023-10-23', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, sessionDate: '2023-11-06', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, sessionDate: '2023-11-13', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, sessionDate: '2023-11-20', status: 'present', justified: false },
            // Absence non justifiée
            { studentId: demoStudentId, courseId: 'CRS001', campusId: demoCampus, sessionDate: '2023-11-22', status: 'absent', justified: false },
            // Absence justifiée
            { studentId: demoStudentId, courseId: 'CRS003', campusId: demoCampus, sessionDate: '2023-11-04', status: 'absent', justified: true, justificationNote: 'certificat médical' },
            { studentId: demoStudentId, courseId: 'CRS003', campusId: demoCampus, sessionDate: '2023-10-07', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS003', campusId: demoCampus, sessionDate: '2023-10-14', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS003', campusId: demoCampus, sessionDate: '2023-10-21', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS003', campusId: demoCampus, sessionDate: '2023-11-18', status: 'present', justified: false },
            // Semestre actuel CRS002
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, sessionDate: '2025-09-15', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, sessionDate: '2025-09-22', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, sessionDate: '2025-09-29', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, sessionDate: '2025-10-06', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, sessionDate: '2025-10-13', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, sessionDate: '2025-10-20', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, sessionDate: '2025-11-03', status: 'present', justified: false },
            { studentId: demoStudentId, courseId: 'CRS002', campusId: demoCampus, sessionDate: '2025-11-10', status: 'late', justified: false },
            // Nouvelle absence non justifiée
            { studentId: demoStudentId, courseId: 'CRS006', campusId: demoCampus, sessionDate: '2025-11-17', status: 'absent', justified: false },
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
