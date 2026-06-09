const Payment = require('./payment.model');

// ── Helpers ───────────────────────────────────────────────────────────────────

const daysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};

// R1 = 15+ days, R2 = 30+ days, R3 = 45+ days
const getDunningStage = (dueDate) => {
    const days = daysOverdue(dueDate);
    if (days >= 45) return 'R3';
    if (days >= 30) return 'R2';
    if (days >= 15) return 'R1';
    if (days > 0)   return 'PENDING';
    return null;
};

// ── Student queries ───────────────────────────────────────────────────────────

const getPaymentsByStudent = async (studentId) => {
    if (!studentId) throw new Error('studentId est obligatoire');
    return Payment.findAll({
        where: { studentId },
        order: [['due_date', 'ASC']],
    });
};

const getStudentBillingSummary = async (studentId, academicYear) => {
    if (!studentId) throw new Error('studentId est obligatoire');

    const where = { studentId };
    if (academicYear) where.academicYear = academicYear;

    const payments = await Payment.findAll({ where });

    const totalInvoiced  = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalPaid      = payments
        .filter(p => p.status === 'Paid')
        .reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalOverdue   = payments
        .filter(p => p.status === 'Delay')
        .reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const nextPayment    = payments
        .filter(p => p.status !== 'Paid')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null;

    return {
        totalInvoiced: +totalInvoiced.toFixed(2),
        totalPaid:     +totalPaid.toFixed(2),
        totalOverdue:  +totalOverdue.toFixed(2),
        outstanding:   +(totalInvoiced - totalPaid).toFixed(2),
        nextPayment,
        payments,
    };
};

// ── Admin / campus queries ────────────────────────────────────────────────────

// Reads payments via a join on the students table (campus_id is on students)
const getPaymentsByCampus = async (campusId, { status, academicYear, semester, search } = {}) => {
    if (!campusId) throw new Error('campusId est obligatoire');

    const sequelize = require('../config/database.config');

    // Build dynamic WHERE clauses for payments
    const paymentWhere = [];
    const params = { campusId };

    if (status)       { paymentWhere.push('p.status = :status');           params.status = status; }
    if (academicYear) { paymentWhere.push('p.academic_year = :academicYear'); params.academicYear = academicYear; }
    if (semester)     { paymentWhere.push('p.semester = :semester');        params.semester = semester; }
    if (search)       {
        paymentWhere.push('(s.first_name ILIKE :search OR s.last_name ILIKE :search OR p.payment_id ILIKE :search)');
        params.search = `%${search}%`;
    }

    const whereClause = paymentWhere.length
        ? 'AND ' + paymentWhere.join(' AND ')
        : '';

    const rows = await sequelize.query(`
        SELECT
            p.*,
            s.first_name,
            s.last_name,
            s.email,
            s.program_id,
            s.campus_id
        FROM payments p
        JOIN students s ON s.student_id = p.student_id
        WHERE s.campus_id = :campusId
        ${whereClause}
        ORDER BY p.due_date ASC
    `, { replacements: params, type: sequelize.QueryTypes.SELECT });

    return rows;
};

const getCampusBillingStats = async (campusId, academicYear) => {
    if (!campusId) throw new Error('campusId est obligatoire');

    const sequelize = require('../config/database.config');
    const params = { campusId };
    const yearClause = academicYear ? 'AND p.academic_year = :academicYear' : '';
    if (academicYear) params.academicYear = academicYear;

    const [stats] = await sequelize.query(`
        SELECT
            COUNT(p.payment_id)                                              AS total_invoices,
            COALESCE(SUM(p.amount), 0)                                       AS total_invoiced,
            COALESCE(SUM(CASE WHEN p.status = 'Paid'  THEN p.amount ELSE 0 END), 0) AS total_collected,
            COALESCE(SUM(CASE WHEN p.status = 'Delay' THEN p.amount ELSE 0 END), 0) AS total_overdue,
            COUNT(CASE WHEN p.status = 'Delay' THEN 1 END)                  AS overdue_count,
            AVG(
                CASE WHEN p.status = 'Paid' AND p.payment_date IS NOT NULL
                     THEN p.payment_date - p.due_date
                END
            )                                                                AS avg_recovery_days
        FROM payments p
        JOIN students s ON s.student_id = p.student_id
        WHERE s.campus_id = :campusId
        ${yearClause}
    `, { replacements: params, type: sequelize.QueryTypes.SELECT });

    return {
        totalInvoices:     parseInt(stats.total_invoices, 10),
        totalInvoiced:     parseFloat(stats.total_invoiced),
        totalCollected:    parseFloat(stats.total_collected),
        totalOverdue:      parseFloat(stats.total_overdue),
        overdueCount:      parseInt(stats.overdue_count, 10),
        collectionRate:    parseFloat(stats.total_invoiced) > 0
            ? +((parseFloat(stats.total_collected) / parseFloat(stats.total_invoiced)) * 100).toFixed(1)
            : 0,
        avgRecoveryDays:   stats.avg_recovery_days !== null
            ? +parseFloat(stats.avg_recovery_days).toFixed(1)
            : null,
    };
};

// Returns all overdue payments with their dunning stage (R1/R2/R3), grouped by campus
const getOverduePayments = async (campusId) => {
    if (!campusId) throw new Error('campusId est obligatoire');

    const sequelize = require('../config/database.config');
    const rows = await sequelize.query(`
        SELECT
            p.*,
            s.first_name,
            s.last_name,
            s.email,
            s.program_id,
            s.campus_id,
            CURRENT_DATE - p.due_date AS days_overdue
        FROM payments p
        JOIN students s ON s.student_id = p.student_id
        WHERE s.campus_id = :campusId
          AND p.status = 'Delay'
          AND p.due_date IS NOT NULL
        ORDER BY p.due_date ASC
    `, { replacements: { campusId }, type: sequelize.QueryTypes.SELECT });

    return rows.map(r => ({
        ...r,
        dunningStage: getDunningStage(r.due_date),
        daysOverdue: parseInt(r.days_overdue, 10) || 0,
    }));
};

// Returns overdue breakdown across all campuses (executive view)
const getOverdueByAllCampuses = async () => {
    const sequelize = require('../config/database.config');
    const rows = await sequelize.query(`
        SELECT
            s.campus_id,
            COUNT(p.payment_id)       AS overdue_count,
            SUM(p.amount)             AS overdue_amount
        FROM payments p
        JOIN students s ON s.student_id = p.student_id
        WHERE p.status = 'Delay'
        GROUP BY s.campus_id
        ORDER BY overdue_amount DESC
    `, { type: sequelize.QueryTypes.SELECT });

    return rows.map(r => ({
        campusId:      r.campus_id,
        overdueCount:  parseInt(r.overdue_count, 10),
        overdueAmount: parseFloat(r.overdue_amount),
    }));
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

const getPaymentById = async (paymentId) => {
    return Payment.findByPk(paymentId);
};

const createPayment = async (data) => {
    return Payment.create(data);
};

const updatePayment = async (paymentId, data) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return null;
    return payment.update(data);
};

const deletePayment = async (paymentId) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return null;
    await payment.destroy();
    return true;
};

// ── Dunning helpers (used by dunning service) ─────────────────────────────────

const getPaymentsForDunning = async (campusId) => {
    const sequelize = require('../config/database.config');
    const rows = await sequelize.query(`
        SELECT
            p.*,
            s.first_name,
            s.last_name,
            s.email,
            s.campus_id,
            CURRENT_DATE - p.due_date AS days_overdue
        FROM payments p
        JOIN students s ON s.student_id = p.student_id
        WHERE p.status = 'Delay'
          AND p.due_date < CURRENT_DATE
          ${campusId ? 'AND s.campus_id = :campusId' : ''}
        ORDER BY p.due_date ASC
    `, {
        replacements: campusId ? { campusId } : {},
        type: sequelize.QueryTypes.SELECT,
    });

    return rows.map(r => ({
        ...r,
        dunningStage: getDunningStage(r.due_date),
        daysOverdue: parseInt(r.days_overdue, 10) || 0,
    }));
};

// Tags a payment with its dunning stage in the notes field
const markDunningStage = async (paymentId, stage) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return null;
    const stageTag = `[${stage}]`;
    const currentNotes = payment.notes || '';
    // Remove any existing stage tag and prepend the new one
    const cleaned = currentNotes.replace(/\[R[123]\]/g, '').trim();
    const newNotes = `${stageTag} ${cleaned}`.trim().slice(0, 160);
    return payment.update({ notes: newNotes });
};

// ── AI Agent summary ──────────────────────────────────────────────────────────

const getBillingForAgent = async (userId, campusId) => {
    // userId is the student_id in this context
    if (campusId) {
        const sequelize = require('../config/database.config');
        const [row] = await sequelize.query(
            `SELECT 1 FROM students WHERE student_id = :userId AND campus_id = :campusId LIMIT 1`,
            { replacements: { userId, campusId }, type: sequelize.QueryTypes.SELECT }
        );
        if (!row) return { message: 'No billing records found for this user.' };
    }

    const payments = await Payment.findAll({
        where: { studentId: userId },
        order: [['due_date', 'ASC']],
    });

    if (!payments.length) return { message: 'No billing records found for this user.' };

    const totalInvoiced = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalPaid     = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const overdue       = payments.filter(p => p.status === 'Delay');

    return {
        totalInvoiced: +totalInvoiced.toFixed(2),
        totalPaid:     +totalPaid.toFixed(2),
        outstanding:   +(totalInvoiced - totalPaid).toFixed(2),
        overdueCount:  overdue.length,
        overdueAmount: +overdue.reduce((s, p) => s + parseFloat(p.amount || 0), 0).toFixed(2),
        payments: payments.map(p => ({
            paymentId:    p.paymentId,
            amount:       p.amount,
            status:       p.status,
            dueDate:      p.dueDate,
            academicYear: p.academicYear,
            semester:     p.semester,
        })),
    };
};

module.exports = {
    getPaymentsByStudent,
    getStudentBillingSummary,
    getPaymentsByCampus,
    getCampusBillingStats,
    getOverduePayments,
    getOverdueByAllCampuses,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
    getPaymentsForDunning,
    markDunningStage,
    getBillingForAgent,
    getDunningStage,
};
