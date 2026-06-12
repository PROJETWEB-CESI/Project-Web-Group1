const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const { authenticate } = require('./auth.middleware');

router.get('/validate', authenticate, AuthController.validate);
router.get('/me', authenticate, AuthController.me);
router.put('/me', authenticate, AuthController.updateMe);
router.put('/me/password', authenticate, AuthController.changePassword);
router.get('/sessions', authenticate, AuthController.listSessions);
router.delete('/sessions/:id', authenticate, AuthController.revokeSession);
router.get('/events', authenticate, AuthController.streamEvents);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

module.exports = router;