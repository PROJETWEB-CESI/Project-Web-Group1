const express = require('express');
const router = express.Router();
const service = require('./timetable.service');

router.get('/', async (req, res) => {
  try {
    const timetables = await service.getAllTimetables(req.query);
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const timetable = await service.getTimetableById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const timetable = await service.createTimetable(req.body);
    res.status(201).json(timetable);
  } catch (error) {
    if (error.message.includes('conflict')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const timetable = await service.updateTimetable(req.params.id, req.body);
    res.json(timetable);
  } catch (error) {
    if (error.message === 'Timetable not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('conflict')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await service.deleteTimetable(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Timetable not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;