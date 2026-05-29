require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const authRoutes = require('./auth/auth.route');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await sequelize.sync( { alter: true });
        console.log('Database synced');

        app.listen(port, () => {
            console.log(`Auth service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

app.use('/api/auth', authRoutes);

startServer();