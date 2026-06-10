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

      // Salles pour tous les créneaux STU001
      const allRooms = [
        { room_id: 'ROOM101', room_name: 'Business Amphitheater',  room_type: 'Amphithéâtre', capacity: 150, campus_id: 'CAMP001' },
        { room_id: 'ROOM102', room_name: 'Economics Lecture Hall', room_type: 'Amphithéâtre', capacity: 100, campus_id: 'CAMP001' },
        { room_id: 'ROOM201', room_name: 'Data Science Lab',       room_type: 'Laboratoire',  capacity: 40,  campus_id: 'CAMP001' },
        { room_id: 'ROOM205', room_name: 'Finance Lecture Hall',   room_type: 'Amphithéâtre', capacity: 80,  campus_id: 'CAMP001' },
        { room_id: 'ROOM206', room_name: 'Law Seminar Room',       room_type: 'Salle de TD',  capacity: 30,  campus_id: 'CAMP001' },
        { room_id: 'ROOM302', room_name: 'Python Lab',             room_type: 'Laboratoire',  capacity: 35,  campus_id: 'CAMP001' },
        { room_id: 'ROOM303', room_name: 'AI Research Lab',        room_type: 'Laboratoire',  capacity: 30,  campus_id: 'CAMP001' },
        { room_id: 'ROOM304', room_name: 'Web Dev Lab',            room_type: 'Laboratoire',  capacity: 35,  campus_id: 'CAMP001' },
        { room_id: 'ROOM401', room_name: 'Aeromechanics Lab',      room_type: 'Laboratoire',  capacity: 30,  campus_id: 'CAMP001' },
      ];
      for (const r of allRooms) {
        await Room.findOrCreate({ where: { room_id: r.room_id }, defaults: r });
      }

      // Créneaux pour tous les cours STU001 (5 jours de la semaine couverts)
      const ttData = [
        { schedule_id: 'SCH001', course_id: 'CRS001', instructor_id: 'INST001', room_id: 'ROOM101', day_of_week: 'Monday',    start_time: '09:00', end_time: '12:00', semester: 1, academic_year: '2023-2024', status: 'Active' },
        { schedule_id: 'SCH002', course_id: 'CRS003', instructor_id: 'INST002', room_id: 'ROOM302', day_of_week: 'Tuesday',   start_time: '14:00', end_time: '17:00', semester: 1, academic_year: '2023-2024', status: 'Active' },
        { schedule_id: 'SCH003', course_id: 'CRS002', instructor_id: 'INST003', room_id: 'ROOM205', day_of_week: 'Wednesday', start_time: '10:00', end_time: '12:00', semester: 1, academic_year: '2025-2026', status: 'Active' },
        { schedule_id: 'SCH004', course_id: 'CRS004', instructor_id: 'INST001', room_id: 'ROOM101', day_of_week: 'Thursday',  start_time: '14:00', end_time: '17:00', semester: 2, academic_year: '2023-2024', status: 'Active' },
        { schedule_id: 'SCH005', course_id: 'CRS005', instructor_id: 'INST002', room_id: 'ROOM303', day_of_week: 'Friday',    start_time: '09:00', end_time: '12:00', semester: 1, academic_year: '2024-2025', status: 'Active' },
        { schedule_id: 'SCH006', course_id: 'CRS006', instructor_id: 'INST004', room_id: 'ROOM401', day_of_week: 'Monday',    start_time: '14:00', end_time: '17:00', semester: 1, academic_year: '2025-2026', status: 'Active' },
        { schedule_id: 'SCH007', course_id: 'CRS007', instructor_id: 'INST005', room_id: 'ROOM201', day_of_week: 'Tuesday',   start_time: '10:00', end_time: '13:00', semester: 2, academic_year: '2024-2025', status: 'Active' },
        { schedule_id: 'SCH008', course_id: 'CRS008', instructor_id: 'INST006', room_id: 'ROOM102', day_of_week: 'Wednesday', start_time: '14:00', end_time: '16:00', semester: 2, academic_year: '2023-2024', status: 'Active' },
        { schedule_id: 'SCH009', course_id: 'CRS009', instructor_id: 'INST007', room_id: 'ROOM206', day_of_week: 'Thursday',  start_time: '10:00', end_time: '12:00', semester: 1, academic_year: '2024-2025', status: 'Active' },
        { schedule_id: 'SCH010', course_id: 'CRS010', instructor_id: 'INST002', room_id: 'ROOM304', day_of_week: 'Friday',    start_time: '14:00', end_time: '17:00', semester: 2, academic_year: '2024-2025', status: 'Active' },
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