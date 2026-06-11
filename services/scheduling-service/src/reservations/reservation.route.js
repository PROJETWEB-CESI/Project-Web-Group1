const express = require('express');
const router = express.Router();
const service = require('./reservation.service');
const { authorize } = require('../middleware/auth.middleware');

// List reservations (teacher/admin)
router.get('/', authorize(['teacher', 'admin']), async (req, res) => {
  try {
    const reservations = await service.getReservations(req.query);
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a reservation (teacher/admin)
router.post('/', authorize(['teacher', 'admin']), async (req, res) => {
  try {
    const reservation = await service.createReservation(req.body);
    res.status(201).json(reservation);
  } catch (err) {
    const status = err.message.includes('déjà réservée') ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

// Cancel own reservation (teacher/admin)
router.delete('/:id', authorize(['teacher', 'admin']), async (req, res) => {
  if (!req.user?.instructorId) {
    return res.status(400).json({ error: 'instructorId manquant dans le token' });
  }
  try {
    await service.cancelReservation(req.params.id, req.user.instructorId);
    res.status(204).send();
  } catch (err) {
    const status = err.message === 'Réservation introuvable' ? 404
      : err.message === 'Non autorisé' ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
