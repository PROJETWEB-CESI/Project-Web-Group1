const { getPaymentsForDunning, markDunningStage } = require('../payments/payment.service');

// Returns a preview of which payments would receive each dunning stage,
// without writing anything to the database.
const previewDunning = async (campusId) => {
    const payments = await getPaymentsForDunning(campusId);

    const result = { R1: [], R2: [], R3: [], PENDING: [], total: payments.length };

    for (const p of payments) {
        const stage = p.dunningStage;
        if (stage && result[stage]) result[stage].push(p);
        else result.PENDING.push(p);
    }

    return result;
};

// Runs the dunning workflow: tags each overdue payment with its stage in the
// notes field and returns a summary of actions taken.
// This does NOT send actual emails — it marks the stage so that a notification
// service (or the AI agent) can trigger the appropriate communication.
const runDunning = async (campusId) => {
    const payments = await getPaymentsForDunning(campusId);

    const summary = { R1: 0, R2: 0, R3: 0, skipped: 0 };

    for (const p of payments) {
        const stage = p.dunningStage;
        if (!stage || stage === 'PENDING') {
            summary.skipped++;
            continue;
        }
        await markDunningStage(p.payment_id, stage);
        summary[stage]++;
    }

    return {
        ...summary,
        total: payments.length,
        campusId: campusId || 'ALL',
        executedAt: new Date().toISOString(),
    };
};

// Marks a single payment with a specific dunning stage (manual override).
const remindOne = async (paymentId, stage) => {
    const validStages = ['R1', 'R2', 'R3'];

    if (stage !== undefined && stage !== null && !validStages.includes(stage)) {
        throw new Error(`Stage invalide : "${stage}". Valeurs acceptées : R1, R2, R3`);
    }

    const resolvedStage = validStages.includes(stage) ? stage : null;

    if (!resolvedStage) {
        // Auto-detect stage from the payment's due date
        const Payment = require('../payments/payment.model');
        const payment = await Payment.findByPk(paymentId);
        if (!payment) return null;

        const { getDunningStage } = require('../payments/payment.service');
        const autoStage = getDunningStage(payment.dueDate);
        if (!autoStage || autoStage === 'PENDING') {
            return { paymentId, message: 'Payment is not yet eligible for dunning.' };
        }
        return markDunningStage(paymentId, autoStage);
    }

    return markDunningStage(paymentId, resolvedStage);
};

module.exports = { previewDunning, runDunning, remindOne };
