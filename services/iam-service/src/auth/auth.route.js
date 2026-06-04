const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const { authenticate } = require('./auth.middleware');

router.get('/validate', authenticate, AuthController.validate);
router.get('/me', authenticate, AuthController.me);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

module.exports = router;