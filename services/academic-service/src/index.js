require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const gradeRoutes = require('./grades/grade.route');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

app.use('/api/grades', gradeRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await sequelize.sync({ alter: true });
        console.log('Database synced');

        app.listen(port, () => {
            console.log(`Academic service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
