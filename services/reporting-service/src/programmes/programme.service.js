const { Op, fn, col, literal } = require('sequelize');
const Student    = require('../models/Student');
const Grade      = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');

// Retourne les studentIds actifs d'un programme (et d'un campus optionnel)
const getStudentIds = async (programmeId, campusId) => {
    const where = { programmeId, administrativeStatus: 'active' };
    if (campusId) where.campusId = campusId;
    const rows = await Student.findAll({ attributes: ['id'], where, raw: true });
    return rows.map(r => r.id);
};

// Taux de réussite via les inscriptions des étudiants du programme
const getSuccessRate = async (studentIds, campusId) => {
    const where = { studentId: { [Op.in]: studentIds } };
    if (campusId) where.campusId = campusId;
    const completed = await Enrollment.count({ where: { ...where, status: 'completed' } });
    const failed    = await Enrollment.count({ where: { ...where, status: 'failed' } });
    const total = completed + failed;
    if (total === 0) return null;
    return +((completed / total) * 100).toFixed(1);
};

// Nombre de cours distincts suivis par les étudiants du programme
const getDistinctCourses = async (studentIds, campusId) => {
    const where = { studentId: { [Op.in]: studentIds } };
    if (campusId) where.campusId = campusId;
    const rows = await Enrollment.findAll({
        attributes: [[fn('DISTINCT', col('courseId')), 'courseId']],
        where,
        raw: true,
    });
    return rows.length;
};

// Moyenne pondérée des notes publiées des étudiants du programme
const getAverageGrade = async (studentIds, campusId) => {
    const where = {
        studentId: { [Op.in]: studentIds },
        publishedAt: { [Op.not]: null },
        score: { [Op.not]: null },
    };
    if (campusId) where.campusId = campusId;
    const result = await Grade.findOne({
        attributes: [
            [fn('SUM', literal('"score" * "coefficient"')), 'weightedSum'],
            [fn('SUM', col('coefficient')), 'totalCoeff'],
        ],
        where,
        raw: true,
    });
    const totalCoeff = parseFloat(result?.totalCoeff);
    if (!totalCoeff) return null;
    return +(parseFloat(result.weightedSum) / totalCoeff).toFixed(2);
};

// Taux de présence des étudiants du programme
const getAttendanceRate = async (studentIds, campusId) => {
    const where = { studentId: { [Op.in]: studentIds } };
    if (campusId) where.campusId = campusId;
    const total = await Attendance.count({ where });
    if (total === 0) return null;
    const present = await Attendance.count({ where: { ...where, status: 'present' } });
    return +((present / total) * 100).toFixed(1);
};

// KPIs complets d'un programme (campusId optionnel)
const getProgrammeStats = async (programmeId, campusId = null) => {
    const studentIds = await getStudentIds(programmeId, campusId);
    const studentCount = studentIds.length;

    if (studentCount === 0) {
        return { programmeId, campusId, studentCount: 0,
                 successRate: null, averageGrade: null, attendanceRate: null, distinctCourses: 0 };
    }

    const [successRate, averageGrade, attendanceRate, distinctCourses] = await Promise.all([
        getSuccessRate(studentIds, campusId),
        getAverageGrade(studentIds, campusId),
        getAttendanceRate(studentIds, campusId),
        getDistinctCourses(studentIds, campusId),
    ]);

    return { programmeId, campusId, studentCount, successRate, averageGrade, attendanceRate, distinctCourses };
};

// KPIs de tous les programmes distincts (campusId optionnel comme filtre)
const getAllProgrammeStats = async (campusId = null) => {
    const where = { administrativeStatus: 'active' };
    if (campusId) where.campusId = campusId;

    const programmes = await Student.findAll({
        attributes: [[fn('DISTINCT', col('programmeId')), 'programmeId']],
        where,
        raw: true,
    });

    return Promise.all(programmes.map(({ programmeId }) => getProgrammeStats(programmeId, campusId)));
};

module.exports = { getProgrammeStats, getAllProgrammeStats };
