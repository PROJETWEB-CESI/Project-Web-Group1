const Student = require('./student.model');
const Enrollment = require('./enrollment.model');

// Retourne le profil complet d'un étudiant avec ses inscriptions actives
const getStudentById = async (id, campusId) => {
    if (!id || !campusId) throw new Error('id et campusId sont obligatoires');
    return Student.findOne({
        where: { id, campusId },
        include: [{ model: Enrollment, as: 'enrollments' }],
    });
};

// Retourne tous les étudiants d'un campus avec filtres optionnels
const getStudents = async (campusId, { programmeId, administrativeStatus, search } = {}) => {
    if (!campusId) throw new Error('campusId est obligatoire');
    const { Op } = require('sequelize');
    const where = { campusId };
    if (programmeId) where.programmeId = programmeId;
    if (administrativeStatus) where.administrativeStatus = administrativeStatus;
    if (search) {
        where[Op.or] = [
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { studentNumber: { [Op.iLike]: `%${search}%` } },
        ];
    }
    return Student.findAll({ where, order: [['lastName', 'ASC']] });
};

// Crée un nouveau dossier étudiant
const createStudent = async (data) => {
    return Student.create(data);
};

// Met à jour le profil d'un étudiant
const updateStudent = async (id, campusId, data) => {
    if (!id || !campusId) throw new Error('id et campusId sont obligatoires');
    const student = await Student.findOne({ where: { id, campusId } });
    if (!student) return null;
    return student.update(data);
};

// Retourne l'historique complet des inscriptions d'un étudiant
const getEnrollmentsByStudent = async (studentId, campusId) => {
    if (!studentId || !campusId) throw new Error('studentId et campusId sont obligatoires');
    return Enrollment.findAll({
        where: { studentId, campusId },
        order: [['academicYear', 'DESC'], ['semester', 'ASC']],
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

module.exports = {
    getStudentById,
    getStudents,
    createStudent,
    updateStudent,
    getEnrollmentsByStudent,
    createEnrollment,
    updateEnrollment,
};
