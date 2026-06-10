const sequelize = require('../../config/database.config');

// If studentId is an IAM UUID, resolve it to the academic studentId via the shared users table.
async function resolveStudentId(studentId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)) {
        return studentId;
    }
    const [row] = await sequelize.query(
        `SELECT "studentId" FROM users WHERE id = :id LIMIT 1`,
        { replacements: { id: studentId }, type: sequelize.QueryTypes.SELECT }
    );
    return row?.studentId || studentId;
}

module.exports = { resolveStudentId };
