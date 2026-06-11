const Campus     = require('../students/campus.model');
const Student    = require('../students/student.model');
const Enrollment = require('../students/enrollment.model');
const Grade      = require('../grades/grade.model');
const Attendance = require('../attendance/attendance.model');

const DEMO_STUDENT_ID = 'STU001';
const DEMO_CAMPUS     = 'CAMP001';

async function seedDemoDataIfEnabled() {
  if (process.env.ENABLE_TEST_CREDENTIALS !== 'true' && process.env.ENABLE_TEST_CREDENTIALS !== '1') return;

  // ── Campus ───────────────────────────────────────────────────────────────
  await Campus.findOrCreate({
    where:    { campusId: DEMO_CAMPUS },
    defaults: { campusId: DEMO_CAMPUS, campusName: 'Paris' },
  });

  // ── Student ──────────────────────────────────────────────────────────────
  await Student.findOrCreate({
    where: { studentId: DEMO_STUDENT_ID },
    defaults: {
      studentId:      DEMO_STUDENT_ID,
      firstName:      'Alexandre',
      lastName:       'Dubois',
      email:          'a.dubois@etu.novacampus.fr',
      campusId:       DEMO_CAMPUS,
      programId:      'PROG001',
      enrollmentYear: 2023,
      status:         'Active',
    },
  });

  // ── Enrollments ──────────────────────────────────────────────────────────
  const enrollments = [
    // S1 2023-2024
    { enrollmentId: 'DEMO_E01', studentId: DEMO_STUDENT_ID, courseId: 'CRS001', semester: 1, academicYear: '2023-2024', status: 'Validated', attendanceRate: 95.0, finalGrade: 13.83 },
    { enrollmentId: 'DEMO_E02', studentId: DEMO_STUDENT_ID, courseId: 'CRS003', semester: 1, academicYear: '2023-2024', status: 'Validated', attendanceRate: 88.0, finalGrade: 12.50 },
    // S2 2023-2024
    { enrollmentId: 'DEMO_E03', studentId: DEMO_STUDENT_ID, courseId: 'CRS004', semester: 2, academicYear: '2023-2024', status: 'Validated', attendanceRate: 92.0, finalGrade: 12.75 },
    { enrollmentId: 'DEMO_E04', studentId: DEMO_STUDENT_ID, courseId: 'CRS008', semester: 2, academicYear: '2023-2024', status: 'Validated', attendanceRate: 90.0, finalGrade: 14.00 },
    // S1 2024-2025
    { enrollmentId: 'DEMO_E05', studentId: DEMO_STUDENT_ID, courseId: 'CRS005', semester: 1, academicYear: '2024-2025', status: 'Validated', attendanceRate: 96.0, finalGrade: 13.25 },
    { enrollmentId: 'DEMO_E06', studentId: DEMO_STUDENT_ID, courseId: 'CRS009', semester: 1, academicYear: '2024-2025', status: 'Validated', attendanceRate: 91.0, finalGrade: 14.50 },
    // S2 2024-2025
    { enrollmentId: 'DEMO_E07', studentId: DEMO_STUDENT_ID, courseId: 'CRS007', semester: 2, academicYear: '2024-2025', status: 'Validated', attendanceRate: 94.0, finalGrade: 14.25 },
    { enrollmentId: 'DEMO_E08', studentId: DEMO_STUDENT_ID, courseId: 'CRS010', semester: 2, academicYear: '2024-2025', status: 'Validated', attendanceRate: 89.0, finalGrade: 13.00 },
    // S1 2025-2026 — semestre en cours
    { enrollmentId: 'DEMO_E09', studentId: DEMO_STUDENT_ID, courseId: 'CRS002', semester: 1, academicYear: '2025-2026', status: 'In Progress', attendanceRate: 96.0,  finalGrade: null },
    { enrollmentId: 'DEMO_E10', studentId: DEMO_STUDENT_ID, courseId: 'CRS006', semester: 1, academicYear: '2025-2026', status: 'In Progress', attendanceRate: 100.0, finalGrade: null },
  ];
  for (const e of enrollments) {
    try {
      await Enrollment.findOrCreate({
        where:    { studentId: e.studentId, courseId: e.courseId, academicYear: e.academicYear },
        defaults: e,
      });
    } catch { /* ignore conflicts */ }
  }

  // ── Published grades ─────────────────────────────────────────────────────
  const now = new Date();
  const publishedGrades = [
    // S1 2023-2024 — CRS001
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, evaluationName: 'Quiz 1',               evaluationNameEn: 'Quiz 1',              score: 15,   scoreMax: 20, coefficient: 1, evaluationDate: '2023-10-12', publishedAt: now },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, evaluationName: 'Partiel intermédiaire', evaluationNameEn: 'Midterm exam',         score: 13,   scoreMax: 20, coefficient: 2, evaluationDate: '2023-11-06', publishedAt: now },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, evaluationName: "Cas d'entreprise",      evaluationNameEn: 'Business case',        score: 16,   scoreMax: 20, coefficient: 1, evaluationDate: '2023-11-22', publishedAt: now },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, evaluationName: 'Présentation orale',    evaluationNameEn: 'Oral presentation',    score: 13,   scoreMax: 20, coefficient: 2, evaluationDate: '2023-11-28', publishedAt: now },
    // S1 2023-2024 — CRS003
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS003', campusId: DEMO_CAMPUS, evaluationName: 'TP Python 1',           evaluationNameEn: 'Python Lab 1',         score: 14,   scoreMax: 20, coefficient: 1, evaluationDate: '2023-10-20', publishedAt: now },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS003', campusId: DEMO_CAMPUS, evaluationName: 'Projet final',          evaluationNameEn: 'Final project',        score: 11,   scoreMax: 20, coefficient: 2, evaluationDate: '2023-12-01', publishedAt: now },
    // S2 2023-2024 — CRS004
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS004', campusId: DEMO_CAMPUS, evaluationName: 'Partiel S2',            evaluationNameEn: 'S2 midterm',           score: 12,   scoreMax: 20, coefficient: 2, evaluationDate: '2024-03-15', publishedAt: now },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS004', campusId: DEMO_CAMPUS, evaluationName: 'Projet marketing',      evaluationNameEn: 'Marketing project',    score: 13.5, scoreMax: 20, coefficient: 2, evaluationDate: '2024-05-20', publishedAt: now },
    // S2 2023-2024 — CRS008
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS008', campusId: DEMO_CAMPUS, evaluationName: 'Examen Éco Int.',        evaluationNameEn: 'Int. Economics exam',  score: 14,   scoreMax: 20, coefficient: 2, evaluationDate: '2024-05-10', publishedAt: now },
    // S1 2024-2025 — CRS005
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS005', campusId: DEMO_CAMPUS, evaluationName: 'QCM IA',                evaluationNameEn: 'AI quiz',              score: 11,   scoreMax: 20, coefficient: 1, evaluationDate: '2024-10-10', publishedAt: now },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS005', campusId: DEMO_CAMPUS, evaluationName: 'Projet IA',             evaluationNameEn: 'AI project',           score: 14,   scoreMax: 20, coefficient: 3, evaluationDate: '2024-11-25', publishedAt: now },
    // S1 2024-2025 — CRS009
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS009', campusId: DEMO_CAMPUS, evaluationName: 'Examen droit',          evaluationNameEn: 'Law exam',             score: 14.5, scoreMax: 20, coefficient: 2, evaluationDate: '2024-12-10', publishedAt: now },
    // S2 2024-2025 — CRS007
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS007', campusId: DEMO_CAMPUS, evaluationName: 'Analyse exploratoire',  evaluationNameEn: 'Exploratory analysis', score: 13.5, scoreMax: 20, coefficient: 2, evaluationDate: '2025-03-12', publishedAt: now },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS007', campusId: DEMO_CAMPUS, evaluationName: 'Rapport final data',    evaluationNameEn: 'Final data report',    score: 15,   scoreMax: 20, coefficient: 2, evaluationDate: '2025-05-20', publishedAt: now },
    // S2 2024-2025 — CRS010
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS010', campusId: DEMO_CAMPUS, evaluationName: 'Projet web',            evaluationNameEn: 'Web project',          score: 13,   scoreMax: 20, coefficient: 2, evaluationDate: '2025-05-15', publishedAt: now },
    // S1 2025-2026 — CRS002 (en cours, publiées)
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, evaluationName: 'TD noté maths',         evaluationNameEn: 'Graded maths session', score: 14,   scoreMax: 20, coefficient: 1, evaluationDate: '2025-10-15', publishedAt: now },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, evaluationName: 'Partiel mi-semestre',   evaluationNameEn: 'Mid-semester exam',    score: 15.5, scoreMax: 20, coefficient: 2, evaluationDate: '2025-11-05', publishedAt: now },
  ];
  for (const g of publishedGrades) {
    try {
      const [instance, created] = await Grade.findOrCreate({
        where:    { studentId: g.studentId, courseId: g.courseId, evaluationName: g.evaluationName },
        defaults: g,
      });
      if (!created && g.evaluationNameEn) await instance.update({ evaluationNameEn: g.evaluationNameEn });
    } catch { /* ignore conflicts */ }
  }

  // ── Unpublished grades (teacher dashboard — INST001 → CRS001, CRS004) ────
  const unpublishedGrades = [
    // CRS001 — 3 notes saisies, pas encore publiées
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, evaluationName: 'Examen final S1',    evaluationNameEn: 'Final exam S1',       score: 14.5, scoreMax: 20, coefficient: 3, evaluationDate: '2026-01-15', publishedAt: null },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, evaluationName: 'Rapport de stage',   evaluationNameEn: 'Internship report',   score: 16,   scoreMax: 20, coefficient: 2, evaluationDate: '2026-01-10', publishedAt: null },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, evaluationName: 'Présentation finale', evaluationNameEn: 'Final presentation', score: 13,   scoreMax: 20, coefficient: 1, evaluationDate: '2026-01-12', publishedAt: null },
    // CRS004 — 2 notes saisies, pas encore publiées
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS004', campusId: DEMO_CAMPUS, evaluationName: 'QCM Marketing',      evaluationNameEn: 'Marketing quiz',      score: 12,   scoreMax: 20, coefficient: 1, evaluationDate: '2026-01-08', publishedAt: null },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS004', campusId: DEMO_CAMPUS, evaluationName: 'Étude de cas',       evaluationNameEn: 'Case study',          score: 15,   scoreMax: 20, coefficient: 2, evaluationDate: '2026-01-14', publishedAt: null },
  ];
  for (const g of unpublishedGrades) {
    const [instance, created] = await Grade.findOrCreate({
      where:    { studentId: g.studentId, courseId: g.courseId, evaluationName: g.evaluationName },
      defaults: g,
    });
    if (!created && instance.publishedAt !== null) {
      await instance.update({ publishedAt: null });
    }
  }

  // ── Attendance ───────────────────────────────────────────────────────────
  const attData = [
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, sessionDate: '2023-10-02', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, sessionDate: '2023-10-09', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, sessionDate: '2023-10-16', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, sessionDate: '2023-10-23', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, sessionDate: '2023-11-06', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, sessionDate: '2023-11-13', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, sessionDate: '2023-11-20', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS001', campusId: DEMO_CAMPUS, sessionDate: '2023-11-22', status: 'absent',  justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS003', campusId: DEMO_CAMPUS, sessionDate: '2023-11-04', status: 'absent',  justified: true, justificationNote: 'certificat médical' },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS003', campusId: DEMO_CAMPUS, sessionDate: '2023-10-07', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS003', campusId: DEMO_CAMPUS, sessionDate: '2023-10-14', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS003', campusId: DEMO_CAMPUS, sessionDate: '2023-10-21', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS003', campusId: DEMO_CAMPUS, sessionDate: '2023-11-18', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, sessionDate: '2025-09-15', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, sessionDate: '2025-09-22', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, sessionDate: '2025-09-29', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, sessionDate: '2025-10-06', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, sessionDate: '2025-10-13', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, sessionDate: '2025-10-20', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, sessionDate: '2025-11-03', status: 'present', justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS002', campusId: DEMO_CAMPUS, sessionDate: '2025-11-10', status: 'late',    justified: false },
    { studentId: DEMO_STUDENT_ID, courseId: 'CRS006', campusId: DEMO_CAMPUS, sessionDate: '2025-11-17', status: 'absent',  justified: false },
  ];
  for (const a of attData) {
    await Attendance.findOrCreate({
      where:    { studentId: a.studentId, courseId: a.courseId, sessionDate: a.sessionDate },
      defaults: a,
    });
  }

  console.log('[DEV] Seeded demo academic data (campus, student, enrollments, grades, attendance)');
}

module.exports = { seedDemoDataIfEnabled };
