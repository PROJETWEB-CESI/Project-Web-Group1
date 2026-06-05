const { Op, fn, col, literal } = require('sequelize');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');

// Nombre d'étudiants actifs et répartition par programme
const getStudentStats = async (campusId) => {
    const total = await Student.count({ where: { campusId, administrativeStatus: 'active' } });

    const byProgramme = await Student.findAll({
        attributes: ['programmeId', [fn('COUNT', col('id')), 'count']],
        where: { campusId, administrativeStatus: 'active' },
        group: ['programmeId'],
        raw: true,
    });

    return { total, byProgramme };
};

// Taux de réussite : completed / (completed + failed)
const getSuccessRate = async (campusId) => {
    const completed = await Enrollment.count({
        where: { campusId, status: 'completed' },
    });
    const failed = await Enrollment.count({
        where: { campusId, status: 'failed' },
    });
    const total = completed + failed;
    if (total === 0) return null;
    return +((completed / total) * 100).toFixed(1);
};

// Moyenne générale pondérée de toutes les notes publiées d'un campus
const getAverageGrade = async (campusId) => {
    const result = await Grade.findOne({
        attributes: [
            [fn('SUM', literal('"score" * "coefficient"')), 'weightedSum'],
            [fn('SUM', col('coefficient')), 'totalCoeff'],
        ],
        where: { campusId, publishedAt: { [Op.not]: null }, score: { [Op.not]: null } },
        raw: true,
    });

    const totalCoeff = parseFloat(result.totalCoeff);
    if (!result || !totalCoeff) return null;
    return +(parseFloat(result.weightedSum) / totalCoeff).toFixed(2);
};

// Taux de présence moyen : sessions présentes / total sessions
const getAttendanceRate = async (campusId) => {
    const total = await Attendance.count({ where: { campusId } });
    if (total === 0) return null;
    const present = await Attendance.count({ where: { campusId, status: 'present' } });
    return +((present / total) * 100).toFixed(1);
};

// KPIs complets d'un campus
const getCampusKpis = async (campusId) => {
    const [studentStats, successRate, averageGrade, attendanceRate] = await Promise.all([
        getStudentStats(campusId),
        getSuccessRate(campusId),
        getAverageGrade(campusId),
        getAttendanceRate(campusId),
    ]);

    return {
        campusId,
        enrolledStudents: studentStats.total,
        successRate,
        averageGrade,
        attendanceRate,
        byProgramme: studentStats.byProgramme,
    };
};

// KPIs de tous les campus distincts connus
const getAllCampusKpis = async () => {
    const campuses = await Student.findAll({
        attributes: [[fn('DISTINCT', col('campusId')), 'campusId']],
        raw: true,
    });
    return Promise.all(campuses.map(({ campusId }) => getCampusKpis(campusId)));
};

module.exports = { getCampusKpis, getAllCampusKpis };
