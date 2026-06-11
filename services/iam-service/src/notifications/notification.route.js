const express = require('express');
const router = express.Router();
const Notification = require('./notification.model');
const { authenticate } = require('../auth/auth.middleware');

// GET /notifications — notifications de l'utilisateur connecté
router.get('/', authenticate, async (req, res) => {
  try {
    const notifs = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /notifications/read-all — marquer tout comme lu
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id, read: false } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /notifications/:id/read — marquer une notification comme lue
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notif) return res.status(404).json({ error: 'Notification introuvable' });
    await notif.update({ read: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
