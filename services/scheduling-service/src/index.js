require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const roomRoutes = require('./rooms/room.route');
const timetableRoutes = require('./timetables/timetable.route');
const { authenticate, authorize } = require('./middleware/auth.middleware');

const app = express();
const port = process.env.API_PORT || 3000;

// Trust reverse proxy headers (X-Forwarded-Proto, etc.) - needed when behind nginx
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Apply authentication middleware to all service routes
app.use('/rooms', authenticate, roomRoutes);
app.use('/timetables', authenticate, timetableRoutes);

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
        { room_id: 'ROOM001', room_name: 'Amphi Commerce A', room_type: 'Amphithéâtre', capacity: 120, campus_id: 'CAMP001' },
        { room_id: 'ROOM002', room_name: 'Salle 204', room_type: 'Salle de TD', capacity: 40, campus_id: 'CAMP001' },
      ];
      for (const r of rooms) {
        await Room.findOrCreate({ where: { room_id: r.room_id }, defaults: r });
      }

      // Demo timetables for student (COM101, ECO101 etc.)
      // Note: These reference courses that should be seeded by academic-service
      const ttData = [
        { schedule_id: 'TT001', course_id: 'COM101', room_id: 'ROOM001', day_of_week: '1', start_time: '08:00', end_time: '10:00', status: 'Active' },
        { schedule_id: 'TT002', course_id: 'ECO101', room_id: 'ROOM002', day_of_week: '3', start_time: '14:00', end_time: '16:00', status: 'Active' },
      ];
      for (const t of ttData) {
        try {
          await Timetable.findOrCreate({ where: { schedule_id: t.schedule_id }, defaults: t });
        } catch (err) {
          console.warn(`[DEV] Could not seed timetable ${t.schedule_id}: ${err.message}`);
        }
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