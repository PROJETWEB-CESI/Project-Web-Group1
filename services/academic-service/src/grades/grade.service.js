const Grade = require('./grade.model');
const { Op } = require('sequelize');

const getGradesByStudent = async (studentId, campusId) => {
    if (!studentId || !campusId) throw new Error('studentId et campusId sont obligatoires');
    return Grade.findAll({
        where: { studentId, campusId, publishedAt: { [Op.not]: null } },
        order: [['evaluationDate', 'DESC']],
    });
};

const getGradesByCourse = async (courseId, campusId) => {
    if (!courseId || !campusId) throw new Error('courseId et campusId sont obligatoires');
    return Grade.findAll({
        where: { courseId, campusId },
        order: [['studentId', 'ASC']],
    });
};

const createGrade = async (data) => {
    return Grade.create(data);
};

const updateGrade = async (id, data) => {
    const grade = await Grade.findByPk(id);
    if (!grade) return null;
    return grade.update(data);
};

const publishGrades = async (courseId, campusId) => {
    if (!courseId || !campusId) throw new Error('courseId et campusId sont obligatoires');
    const [count] = await Grade.update(
        { publishedAt: new Date() },
        { where: { courseId, campusId, publishedAt: null } }
    );
    return count;
};

const deleteGrade = async (id) => {
    const grade = await Grade.findByPk(id);
    if (!grade) return null;
    await grade.destroy();
    return true;
};

// Calcule la moyenne pondérée, le rang et la moyenne de classe d'un étudiant
const getStudentGradeStats = async (studentId, campusId, courseId) => {
    if (!studentId || !campusId) throw new Error('studentId et campusId sont obligatoires');
    const where = { campusId, publishedAt: { [Op.not]: null } };
    if (courseId) where.courseId = courseId;

    const studentGrades = await Grade.findAll({ where: { ...where, studentId } });
    if (studentGrades.length === 0) return { average: null, rank: null, classAverage: null };

    const weightedSum = studentGrades.reduce((sum, g) => sum + (parseFloat(g.score || 0) * g.coefficient), 0);
    const totalCoeff = studentGrades.reduce((sum, g) => sum + g.coefficient, 0);
    const average = totalCoeff > 0 ? +(weightedSum / totalCoeff).toFixed(2) : null;

    // Récupère tous les étudiants du même campus/cours pour calculer la moyenne de classe et le rang
    const sequelize = require('../config/database.config');
    const allStudentIds = await Grade.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('student_id')), 'studentId']],
        where,
        raw: true,
    });

    const averages = await Promise.all(allStudentIds.map(async ({ studentId: sid }) => {
        const grades = await Grade.findAll({ where: { ...where, studentId: sid } });
        const ws = grades.reduce((s, g) => s + (parseFloat(g.score || 0) * g.coefficient), 0);
        const tc = grades.reduce((s, g) => s + g.coefficient, 0);
        return { studentId: sid, average: tc > 0 ? ws / tc : 0 };
    }));

    averages.sort((a, b) => b.average - a.average);
    const rank = averages.findIndex(a => a.studentId === studentId) + 1;
    const classAverage = +(averages.reduce((s, a) => s + a.average, 0) / averages.length).toFixed(2);

    return { average, rank, total: averages.length, classAverage };
};

// Calcule la distribution des notes d'un cours (pour le prof)
const getCourseGradeStats = async (courseId, campusId) => {
    if (!courseId || !campusId) throw new Error('courseId et campusId sont obligatoires');
    const grades = await Grade.findAll({ where: { courseId, campusId, score: { [Op.not]: null } } });
    if (grades.length === 0) return { studentsCount: 0, average: null, median: null, stdDev: null, passRate: null };

    const scores = grades.map(g => parseFloat(g.score)).sort((a, b) => a - b);
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    const median = scores.length % 2 === 0
        ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
        : scores[Math.floor(scores.length / 2)];
    const stdDev = +Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / scores.length).toFixed(2);
    const passRate = +(scores.filter(s => s >= 10).length / scores.length * 100).toFixed(1);
    const studentsCount = new Set(grades.map(g => g.studentId)).size;

    return { studentsCount, average: +avg.toFixed(2), median: +median.toFixed(2), stdDev, passRate };
};

const unpublishGrades = async (courseId, campusId, evaluationName) => {
    if (!courseId || !campusId) throw new Error('courseId et campusId sont obligatoires');
    const where = { courseId, campusId, publishedAt: { [Op.not]: null } };
    if (evaluationName) where.evaluationName = evaluationName;
    const [count] = await Grade.update({ publishedAt: null }, { where });
    return count;
};

const deleteEvaluationGrades = async (courseId, campusId, evaluationName) => {
    if (!courseId || !campusId || !evaluationName) throw new Error('courseId, campusId et evaluationName sont obligatoires');
    return Grade.destroy({ where: { courseId, campusId, evaluationName } });
};

// Retourne la moyenne de classe par semestre pour l'étudiant donné
// "classe" = tous les étudiants ayant des notes publiées dans les mêmes cours / campus
const getStudentSemesterClassAverages = async (studentId, campusId) => {
    const Enrollment = require('../students/enrollment.model');

    const enrollments = await Enrollment.findAll({
        where: { studentId },
        order: [['academicYear', 'ASC'], ['semester', 'ASC']],
        raw: true,
    });
    if (!enrollments.length) return [];

    const semMap = new Map();
    for (const e of enrollments) {
        const key = `${e.academic_year || e.academicYear}-S${e.semester}`;
        if (!semMap.has(key)) {
            semMap.set(key, {
                label: `S${e.semester}`,
                courseIds: [],
            });
        }
        semMap.get(key).courseIds.push(e.course_id || e.courseId);
    }

    const results = [];
    for (const [, sem] of semMap) {
        const grades = await Grade.findAll({
            where: {
                courseId: { [Op.in]: sem.courseIds },
                campusId,
                publishedAt: { [Op.not]: null },
                score: { [Op.not]: null },
            },
            raw: true,
        });
        if (!grades.length) continue;

        const byStudent = new Map();
        for (const g of grades) {
            if (!byStudent.has(g.student_id || g.studentId)) byStudent.set(g.student_id || g.studentId, []);
            byStudent.get(g.student_id || g.studentId).push(g);
        }

        const studentAvgs = [];
        for (const [, sg] of byStudent) {
            const wSum = sg.reduce((s, g) => s + parseFloat(g.score || 0) * (g.coefficient || 1), 0);
            const wCoeff = sg.reduce((s, g) => s + (g.coefficient || 1), 0);
            if (wCoeff > 0) studentAvgs.push(wSum / wCoeff);
        }
        if (!studentAvgs.length) continue;

        const classAvg = studentAvgs.reduce((s, v) => s + v, 0) / studentAvgs.length;
        results.push({ label: sem.label, classAverage: +classAvg.toFixed(2) });
    }
    return results;
};

module.exports = {
    getGradesByStudent,
    getGradesByCourse,
    createGrade,
    updateGrade,
    publishGrades,
    unpublishGrades,
    deleteEvaluationGrades,
    deleteGrade,
    getStudentGradeStats,
    getCourseGradeStats,
    getStudentSemesterClassAverages,
};
