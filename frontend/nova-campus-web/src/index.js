require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const sequelize    = require('./config/database.config');
const studentRoutes = require('./students/student.route');

const app  = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

app.use('/api/students', studentRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');
        app.listen(port, () => {
            console.log(`Academic service running on port ${port}`);
        });
    } catch (error) {
        console.error('Cannot connect to database:', error);
        process.exit(1);
    }
}

startServer();