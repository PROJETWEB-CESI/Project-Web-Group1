const UserService = require('./user.service');

async function list(req, res) {
  try {
    const users = await UserService.listUsers(req.query);
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const user = await UserService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const user = await UserService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const ok = await UserService.deleteUser(req.params.id);
    if (!ok) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const result = await UserService.resetPasswordByStudentId(req.params.studentId);
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { list, getOne, create, update, remove, resetPassword };
