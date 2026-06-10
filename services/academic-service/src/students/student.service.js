const { Op, fn, col, literal } = require('sequelize');
const Student = require('./student.model');
const Enrollment = require('./enrollment.model');
const Course = require('../courses/course.model');
const Campus = require('./campus.model');
const Program = require('./program.model');
const Grade = require('../grades/grade.model');

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

// Crée un nouveau dossier étudiant
const createStudent = async (data) => {
    return Student.create(data);
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

    return { campusId, totalStudents, byProgram, successRate, averageGrade };
};

module.exports = {
    getStudentById,
    getStudents,
    createStudent,
    updateStudent,
    getEnrollmentsByStudent,
    createEnrollment,
    updateEnrollment,
    getCampusById,
    getCampusStats,
};
