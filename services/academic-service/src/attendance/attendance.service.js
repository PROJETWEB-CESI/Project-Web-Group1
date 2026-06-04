const Attendance = require('./attendance.model');

// Retourne toutes les présences d'une session (cours + date) — réservé prof/admin
const getAttendanceByCourse = async (courseId, campusId, sessionDate) => {
    if (!courseId || !campusId || !sessionDate) throw new Error('courseId, campusId et sessionDate sont obligatoires');
    return Attendance.findAll({
        where: { courseId, campusId, sessionDate },
        order: [['studentId', 'ASC']],
    });
};

// Retourne tout l'historique de présence d'un étudiant — réservé à l'étudiant concerné
const getAttendanceByStudent = async (studentId, campusId) => {
    if (!studentId || !campusId) throw new Error('studentId et campusId sont obligatoires');
    return Attendance.findAll({
        where: { studentId, campusId },
        order: [['sessionDate', 'DESC']],
    });
};

// Enregistre l'appel d'une session entière en une seule fois
// updateOnDuplicate : si le prof refait l'appel, met à jour sans créer de doublons
const markAttendance = async (records) => {
    if (!Array.isArray(records) || records.length === 0) throw new Error('records doit être un tableau non vide');
    return Attendance.bulkCreate(records, {
        updateOnDuplicate: ['status', 'updatedAt'],
    });
};

// Met à jour un enregistrement de présence par son id
const updateAttendance = async (id, data) => {
    const record = await Attendance.findByPk(id);
    if (!record) return null;
    return record.update(data);
};

// Justifie une absence ou un retard — impossible de justifier une présence
const justifyAbsence = async (id, justificationNote) => {
    if (!justificationNote) throw new Error('Une justification est obligatoire');
    const record = await Attendance.findByPk(id);
    if (!record) return null;
    if (record.status === 'present') throw new Error('Impossible de justifier une présence');
    return record.update({ justified: true, justificationNote });
};

module.exports = {
    getAttendanceByCourse,
    getAttendanceByStudent,
    markAttendance,
    updateAttendance,
    justifyAbsence,
};
