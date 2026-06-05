const express = require('express');
const router = express.Router();
const service = require('./room.service');

router.get('/', async (req, res) => {
  try {
    const rooms = await service.getAllRooms(req.query.campus_id);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const room = await service.getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const room = await service.createRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const room = await service.updateRoom(req.params.id, req.body);
    res.json(room);
  } catch (error) {
    if (error.message === 'Room not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await service.deleteRoom(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Room not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;