const AuditLog = require('./audit.model');

async function logAudit({ campusId, userId, userRole, action, entityType, entityId, diff, ip }) {
  try {
    await AuditLog.create({
      campusId,
      userId,
      userRole,
      action,
      entityType,
      entityId: entityId ?? null,
      diff: diff ?? null,
      ip: ip ?? null,
    });
  } catch (err) {
    // Audit failure must never break the main flow
    console.error('[audit] Failed to write log:', err.message);
  }
}

// Convenience wrapper when a req object is available (in route handlers)
async function logAuditFromReq(req, { action, entityType, entityId, diff }) {
  return logAudit({
    campusId: req.user.campusId,
    userId: req.user.id,
    userRole: req.user.role,
    action,
    entityType,
    entityId,
    diff,
    ip: req.ip,
  });
}

module.exports = { logAudit, logAuditFromReq };
