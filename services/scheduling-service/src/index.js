require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const roomRoutes = require('./rooms/room.route');
const timetableRoutes = require('./timetables/timetable.route');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.use('/rooms', roomRoutes);
app.use('/timetables', timetableRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    // Seed demo timetable/rooms for test student (used in /dashboard/student?tab=schedule)
    if (process.env.ENABLE_TEST_CREDENTIALS === 'true' || process.env.ENABLE_TEST_CREDENTIALS === '1') {
      const Timetable = require('./timetables/timetable.model');
      const Room = require('./rooms/room.model');

      // Demo rooms
      const rooms = [
        { id: 'ROOM001', name: 'Amphi Commerce A', type: 'Amphithéâtre', capacity: 120, campusId: 'CAMP001' },
        { id: 'ROOM002', name: 'Salle 204', type: 'Salle de TD', capacity: 40, campusId: 'CAMP001' },
      ];
      for (const r of rooms) {
        await Room.findOrCreate({ where: { id: r.id }, defaults: r });
      }

      // Demo timetables for student (COM101, ECO101 etc.)
      const ttData = [
        { id: 'TT001', courseId: 'COM101', roomId: 'ROOM001', dayOfWeek: 1, startTime: '08:00', endTime: '10:00', campusId: 'CAMP001' },
        { id: 'TT002', courseId: 'ECO101', roomId: 'ROOM002', dayOfWeek: 3, startTime: '14:00', endTime: '16:00', campusId: 'CAMP001' },
      ];
      for (const t of ttData) {
        await Timetable.findOrCreate({ where: { id: t.id }, defaults: t });
      }

      console.log('[DEV] Seeded demo scheduling data (rooms, timetables) for student schedule');
    }

    app.listen(port, () => {
      console.log(`Scheduling service running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();