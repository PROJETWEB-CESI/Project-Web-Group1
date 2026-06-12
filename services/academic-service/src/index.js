require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database.config');
const gradeRoutes = require('./grades/grade.route');
const attendanceRoutes = require('./attendance/attendance.route');
const studentRoutes = require('./students/student.route');
const teacherRoutes = require('./teacher/teacher.route');
const { seedDemoDataIfEnabled } = require('./seed/seedDemoData');
const { authenticate } = require('./middleware/auth.middleware');
const { csrfProtection } = require('./middleware/csrf.middleware');
require('./config/associations');

const app = express();
app.disable('x-powered-by');
const port = process.env.API_PORT || 3000;

// Trust reverse proxy headers (X-Forwarded-Proto, etc.) - needed when behind nginx
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Apply authentication middleware to all service routes
app.use('/grades', authenticate, gradeRoutes);
app.use('/attendance', authenticate, attendanceRoutes);
app.use('/students', authenticate, studentRoutes);
app.use('/teacher', authenticate, teacherRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await sequelize.sync();
        console.log('Database synced');

        // Add evaluation_name_en column without touching existing columns
        await sequelize.query(`ALTER TABLE grades ADD COLUMN IF NOT EXISTS evaluation_name_en VARCHAR(100);`);

        await seedDemoDataIfEnabled();

        app.listen(port, () => {
            console.log(`Academic service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
