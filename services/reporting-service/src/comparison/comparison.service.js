const { fn, col } = require('sequelize');
const Student = require('../models/Student');
const { getAllCampusKpis } = require('../kpis/kpi.service');

// Moyenne d'un tableau en ignorant les null
const mean = (values, decimals = 1) => {
    const valid = values.filter(v => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return +(valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(decimals);
};

// Comparaison inter-campus + moyennes du groupe
const getCampusComparison = async () => {
    const campuses = await getAllCampusKpis();

    const groupAverages = {
        enrolledStudents: mean(campuses.map(c => c.enrolledStudents), 0),
        successRate:      mean(campuses.map(c => c.successRate)),
        averageGrade:     mean(campuses.map(c => c.averageGrade), 2),
        attendanceRate:   mean(campuses.map(c => c.attendanceRate)),
    };

    return { campuses, groupAverages };
};

// Évolution des effectifs par campus et par année d'entrée (pour le graphique de tendance)
const getEnrollmentTrend = async () => {
    const rows = await Student.findAll({
        attributes: [
            'campusId',
            'entryYear',
            [fn('COUNT', col('id')), 'count'],
        ],
        where: { administrativeStatus: 'active' },
        group: ['campusId', 'entryYear'],
        order: [['entryYear', 'ASC']],
        raw: true,
    });

    // Regroupe par campusId : { "campus-uuid": [{ entryYear, count }, ...] }
    return rows.reduce((acc, { campusId, entryYear, count }) => {
        if (!acc[campusId]) acc[campusId] = [];
        acc[campusId].push({ entryYear, count: parseInt(count, 10) });
        return acc;
    }, {});
};

module.exports = { getCampusComparison, getEnrollmentTrend };
