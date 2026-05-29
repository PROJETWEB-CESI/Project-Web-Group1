const express = require('express');
const router = express.Router();
const AuthController = require('../auth/auth.controller');
const { authenticate } = require('../auth/auth.middleware');

router.get('/validate', authenticate, AuthController.validate);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

module.exports = router;