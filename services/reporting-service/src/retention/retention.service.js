const { Op, fn, col, literal } = require('sequelize');
const Student = require('../models/Student');

const DROPPED_STATUSES = ['inactive', 'suspended'];

// Compte actifs et abandons avec une seule requête GROUP BY
const aggregateByField = async (groupField, extraWhere = {}) => {
    return Student.findAll({
        attributes: [
            groupField,
            [fn('COUNT', col('id')), 'total'],
            [fn('SUM', literal(`CASE WHEN "administrativeStatus" = 'active' THEN 1 ELSE 0 END`)), 'active'],
        ],
        where: extraWhere,
        group: [groupField],
        order: [[groupField, 'ASC']],
        raw: true,
    });
};

// Transforme une ligne brute en objet métier
const toRetentionRow = (row, keyField) => {
    const total   = parseInt(row.total, 10);
    const active  = parseInt(row.active, 10);
    const dropped = total - active;
    return {
        [keyField]:    row[keyField],
        total,
        active,
        dropped,
        retentionRate: total === 0 ? null : +((active  / total) * 100).toFixed(1),
        dropoutRate:   total === 0 ? null : +((dropped / total) * 100).toFixed(1),
    };
};

// Résumé global groupe : étudiants totaux, abandons, taux d'abandon
const getGroupSummary = async () => {
    const totalActive  = await Student.count({ where: { administrativeStatus: 'active' } });
    const totalDropped = await Student.count({ where: { administrativeStatus: { [Op.in]: DROPPED_STATUSES } } });
    const totalEver    = totalActive + totalDropped;

    return {
        totalActiveStudents: totalActive,
        totalStudentsEver:   totalEver,
        droppedStudents:     totalDropped,
        dropoutRate:         totalEver === 0 ? null : +((totalDropped / totalEver) * 100).toFixed(1),
    };
};

// Rétention par cohorte (année d'entrée) — campusId optionnel
const getCohortRetention = async (campusId = null) => {
    const where = campusId ? { campusId } : {};
    const rows = await aggregateByField('entryYear', where);
    return rows.map(r => toRetentionRow(r, 'entryYear'));
};

// Taux d'abandon par campus
const getDropoutByCampus = async () => {
    const rows = await aggregateByField('campusId');
    return rows.map(r => toRetentionRow(r, 'campusId'));
};

module.exports = { getGroupSummary, getCohortRetention, getDropoutByCampus };
