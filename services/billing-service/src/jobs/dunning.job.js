const cron = require('node-cron');
const { Op } = require('sequelize');
const Invoice = require('../invoices/invoices.model');
const { publish } = require('../events/event-publisher');
const { logAudit } = require('../audit/audit.service');

const DUNNING_LEVELS = [null, 'R1', 'R2', 'R3'];
const MIN_DAYS_BETWEEN_REMINDERS = 7;

async function runDunningCheck() {
  const now = new Date();

  const candidates = await Invoice.findAll({
    where: {
      status: { [Op.in]: ['pending', 'overdue'] },
      dueDate: { [Op.lt]: now },
      dunningLevel: { [Op.or]: [{ [Op.ne]: 'R3' }, { [Op.is]: null }] },
    },
  });

  let advanced = 0;

  for (const invoice of candidates) {
    // Throttle: skip if a reminder was sent too recently
    if (invoice.lastReminderSentAt) {
      const daysSince = (now - new Date(invoice.lastReminderSentAt)) / 86400000;
      if (daysSince < MIN_DAYS_BETWEEN_REMINDERS) continue;
    }

    const current = DUNNING_LEVELS.indexOf(invoice.dunningLevel);
    const next = DUNNING_LEVELS[current + 1];
    if (!next) continue;

    const prevLevel = invoice.dunningLevel;
    invoice.dunningLevel = next;
    invoice.status = 'overdue';
    invoice.lastReminderSentAt = now;
    await invoice.save();

    publish('DunningAdvanced', {
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      campusId: invoice.campusId,
      reference: invoice.reference,
      dunningLevel: next,
      amount: invoice.totalAmount,
    });

    await logAudit({
      campusId: invoice.campusId,
      userId: 0, // system action
      userRole: 'system',
      action: 'dunning.advanced',
      entityType: 'invoice',
      entityId: invoice.id,
      diff: { dunningLevel: { from: prevLevel, to: next } },
    });

    advanced++;
  }

  if (advanced > 0) {
    console.log(`[dunning-job] Advanced dunning for ${advanced} invoice(s).`);
  }
}

function startDunningJob() {
  // Run every day at 08:00 server time
  cron.schedule('0 8 * * *', () => {
    console.log('[dunning-job] Running scheduled dunning check…');
    runDunningCheck().catch(err => console.error('[dunning-job] Error:', err.message));
  });
  console.log('[billing-service] Automated dunning job scheduled (daily at 08:00).');
}

module.exports = { startDunningJob, runDunningCheck };
