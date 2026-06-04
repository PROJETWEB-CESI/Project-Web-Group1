const AuthService = require('./auth.service');

async function register(req, res) {
  try {
    const { email, password, campusId, firstName, lastName } = req.body;
    const result = await AuthService.register(email, password, { campusId, firstName, lastName });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        res.status(200).json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

function validate(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.status(200).json({ user: req.user });
}

async function me(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await AuthService.getMe(req.user);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = {
  register,
  login,
  validate,
  me,
};
