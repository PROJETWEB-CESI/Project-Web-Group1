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

module.exports = {
    getGradesByStudent,
    getGradesByCourse,
    createGrade,
    updateGrade,
    publishGrades,
    deleteGrade,
};
