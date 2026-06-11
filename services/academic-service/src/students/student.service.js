const { Op, fn, col, literal } = require('sequelize');
const Student = require('./student.model');
const Enrollment = require('./enrollment.model');
const Course = require('../courses/course.model');
const Campus = require('./campus.model');
const Program = require('./program.model');
const Grade = require('../grades/grade.model');
const Attendance = require('../attendance/attendance.model');

// Retourne le profil complet d'un étudiant avec ses inscriptions actives
const getStudentById = async (id, campusId) => {
    if (!id || !campusId) throw new Error('id et campusId sont obligatoires');
    return Student.findOne({
        where: { studentId: id, campusId },
        include: [
            { model: Enrollment, as: 'enrollments' },
            { model: Campus, as: 'campus', attributes: ['campusId', 'campusName'] },
            { model: Program, as: 'program', attributes: ['programId', 'programName', 'durationYears', 'annualTuition'] },
        ],
    });
};

// Returns all students of a campus, with optional filters
const getStudents = async (campusId, { programId, status, search } = {}) => {
    if (!campusId) throw new Error('campusId est obligatoire');
    const where = { campusId };
    if (programId) where.programId = programId;
    if (status) where.status = status;
    if (search) {
        where[Op.or] = [
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { studentId: { [Op.iLike]: `%${search}%` } },
        ];
    }
    return Student.findAll({
        where,
        include: [{ model: Program, as: 'program', attributes: ['programId', 'programName'] }],
        order: [['lastName', 'ASC']],
    });
};

// Génère le prochain identifiant étudiant disponible (format STUxxx)
const generateNextStudentId = async () => {
    const students = await Student.findAll({ attributes: ['studentId'], raw: true });
    let max = 0;
    for (const s of students) {
        const match = /^STU(\d+)$/.exec(s.studentId || '');
        if (match) max = Math.max(max, parseInt(match[1], 10));
    }
    return `STU${String(max + 1).padStart(3, '0')}`;
};

// Normalise un nom pour l'utiliser dans une adresse email (minuscules, sans accents/espaces)
const normalizeForEmail = (str) =>
    (str || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '');

// Génère une adresse email <prenom>.<nom>@novacampus.fr, en ajoutant un numéro en cas de doublon
const generateEmail = async (firstName, lastName) => {
    const base = `${normalizeForEmail(firstName)}.${normalizeForEmail(lastName)}`;
    let suffix = 1;
    let email = `${base}@novacampus.fr`;
    while (await Student.findOne({ where: { email } })) {
        suffix += 1;
        email = `${base}${suffix}@novacampus.fr`;
    }
    return email;
};

// Crée un nouveau dossier étudiant (le studentId et l'email sont générés automatiquement)
const createStudent = async (data) => {
    const studentId = await generateNextStudentId();
    const email = await generateEmail(data.firstName, data.lastName);
    return Student.create({
        studentId,
        campusId: data.campusId,
        programId: data.programId,
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        enrollmentYear: data.enrollmentYear,
        status: data.status || 'Active',
        paymentStatus: data.paymentStatus || 'Up to date',
    });
};

// Supprime un dossier étudiant (utilisé pour annuler une création en cas d'échec)
const deleteStudent = async (id, campusId) => {
    if (!id || !campusId) throw new Error('id et campusId sont obligatoires');
    const student = await Student.findOne({ where: { studentId: id, campusId } });
    if (!student) return null;
    await student.destroy();
    return true;
};

// Returns all programs of a campus (for forms)
const getPrograms = async (campusId) => {
    if (!campusId) throw new Error('campusId est obligatoire');
    return Program.findAll({ where: { campusId }, order: [['programName', 'ASC']] });
};

// Met à jour le profil d'un étudiant
const updateStudent = async (id, campusId, data) => {
    if (!id || !campusId) throw new Error('id et campusId sont obligatoires');
    const student = await Student.findOne({ where: { studentId: id, campusId } });
    if (!student) return null;
    return student.update(data);
};

// Retourne l'historique complet des inscriptions d'un étudiant
// Note: Enrollments don't have campus_id, so we first verify the student's campus
const getEnrollmentsByStudent = async (studentId, campusId) => {
    if (!studentId || !campusId) throw new Error('studentId et campusId sont obligatoires');
    
    // Verify student exists and belongs to the specified campus
    const student = await Student.findOne({ where: { studentId, campusId } });
    if (!student) throw new Error('Étudiant non trouvé ou campus incorrect');
    
    // Get all enrollments for this student (no campus filter needed on enrollments table)
    return Enrollment.findAll({
        where: { studentId },
        include: [{ model: Course, as: 'course', attributes: ['courseId', 'courseName', 'credits'] }],
        order: [['academicYear', 'ASC'], ['semester', 'ASC']],
    });
};

// Inscrit un étudiant à un cours
const createEnrollment = async (data) => {
    return Enrollment.create(data);
};

// Met à jour une inscription (note finale, taux de présence, statut)
const updateEnrollment = async (id, data) => {
    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) return null;
    return enrollment.update(data);
};

// Returns basic information about a campus
const getCampusById = async (campusId) => {
    if (!campusId) throw new Error('campusId est obligatoire');
    return Campus.findByPk(campusId);
};

// Returns all campuses (for the executive cross-campus dashboards)
const getAllCampuses = async () => {
    return Campus.findAll({ order: [['campusName', 'ASC']], raw: true });
};

// Returns campus-wide stats for the admin dashboard (headcount, programs, success rate, average grade)
const getCampusStats = async (campusId) => {
    if (!campusId) throw new Error('campusId est obligatoire');

    const totalStudents = await Student.count({ where: { campusId, status: 'Active' } });

    // Breakdown by program
    const byProgramRaw = await Student.findAll({
        attributes: ['programId', [fn('COUNT', col('student_id')), 'count']],
        where: { campusId, status: 'Active' },
        group: ['programId'],
        raw: true,
    });
    const programIds = byProgramRaw.map(r => r.programId);
    const programs = programIds.length
        ? await Program.findAll({ where: { programId: { [Op.in]: programIds } }, raw: true })
        : [];
    const programMap = new Map(programs.map(p => [p.programId, p]));
    const byProgram = byProgramRaw.map(r => ({
        programId: r.programId,
        programName: programMap.get(r.programId)?.programName || r.programId,
        maxStudents: programMap.get(r.programId)?.maxStudents || null,
        studentCount: parseInt(r.count, 10),
    }));

    // Weighted average of all published grades for the campus
    const gradeResult = await Grade.findOne({
        attributes: [
            [fn('SUM', literal('"score" * "coefficient"')), 'weightedSum'],
            [fn('SUM', col('coefficient')), 'totalCoeff'],
        ],
        where: { campusId, publishedAt: { [Op.not]: null }, score: { [Op.not]: null } },
        raw: true,
    });
    const totalCoeff = parseFloat(gradeResult?.totalCoeff);
    const averageGrade = totalCoeff ? +(parseFloat(gradeResult.weightedSum) / totalCoeff).toFixed(2) : null;

    // Success rate: share of published grades that are passing (score >= 10/20)
    const totalGrades = await Grade.count({
        where: { campusId, publishedAt: { [Op.not]: null }, score: { [Op.not]: null } },
    });
    let successRate = null;
    if (totalGrades > 0) {
        const passingGrades = await Grade.count({
            where: {
                campusId,
                publishedAt: { [Op.not]: null },
                score: { [Op.gte]: literal('"score_max" / 2') },
            },
        });
        successRate = +((passingGrades / totalGrades) * 100).toFixed(1);
    }

    // Attendance rate: share of recorded sessions marked "present"
    const totalAttendance = await Attendance.count({ where: { campusId } });
    const presentAttendance = totalAttendance > 0
        ? await Attendance.count({ where: { campusId, status: 'present' } })
        : 0;
    const attendanceRate = totalAttendance > 0 ? +((presentAttendance / totalAttendance) * 100).toFixed(1) : null;

    // Dropout rate: share of students (any enrollment year) no longer "Active"
    const totalStudentsAll = await Student.count({ where: { campusId } });
    const dropoutRate = totalStudentsAll > 0
        ? +(((totalStudentsAll - totalStudents) / totalStudentsAll) * 100).toFixed(1)
        : null;

    return { campusId, totalStudents, totalStudentsAll, byProgram, successRate, averageGrade, attendanceRate, dropoutRate };
};

// Returns the active student headcount per entry year for a campus (enrollment trend chart)
const getEnrollmentTrend = async (campusId) => {
    if (!campusId) throw new Error('campusId est obligatoire');

    const rows = await Student.findAll({
        attributes: ['enrollmentYear', [fn('COUNT', col('student_id')), 'count']],
        where: { campusId, status: 'Active' },
        group: ['enrollmentYear'],
        order: [['enrollmentYear', 'ASC']],
        raw: true,
    });

    return rows.map(r => ({ entryYear: r.enrollmentYear, count: parseInt(r.count, 10) }));
};

module.exports = {
    getStudentById,
    getStudents,
    createStudent,
    deleteStudent,
    updateStudent,
    getEnrollmentsByStudent,
    createEnrollment,
    updateEnrollment,
    getCampusById,
    getAllCampuses,
    getCampusStats,
    getEnrollmentTrend,
    getPrograms,
};
