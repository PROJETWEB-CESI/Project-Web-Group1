require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const gradeRoutes = require('./grades/grade.route');
const attendanceRoutes = require('./attendance/attendance.route');
const studentRoutes = require('./students/student.route');
require('./config/associations');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await sequelize.sync();
        console.log('Database synced');

        // Student pages data seeding note (feature/student-pages branch):
        // When ENABLE_TEST_CREDENTIALS=true (via root .env), ensure demo data exists for the student test user
        // (Léa Moreau / student@test.com, CAMP001): courses, grades, absences, academic history (semesters/inscriptions),
        // and notifications. This data powers the single-path /dashboard/student sections.
        // Extend this file or add a seed script (similar to iam-service) for grades/attendance models when backend
        // integration for student pages is completed.

        app.listen(port, () => {
            console.log(`Academic service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
