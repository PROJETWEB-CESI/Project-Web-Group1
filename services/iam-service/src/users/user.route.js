const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const { authenticate } = require('../auth/auth.middleware');

function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'executive'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

router.use(authenticate);

router.get('/', requireAdmin, UserController.list);
router.post('/', requireAdmin, UserController.create);
router.post('/reset-password/:studentId', requireAdmin, UserController.resetPassword);
router.get('/:id', requireAdmin, UserController.getOne);
router.put('/:id', requireAdmin, UserController.update);
router.delete('/:id', requireAdmin, UserController.remove);

module.exports = router;
