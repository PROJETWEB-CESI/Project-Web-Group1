function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: requires one of [${allowedRoles.join(', ')}]` });
    }
    next();
  };
}

module.exports = { requireRole };
