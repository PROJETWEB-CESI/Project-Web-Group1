require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        app.listen(port, () => {
            console.log(`Reporting service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
