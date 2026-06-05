require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');

// Chargement des modèles en lecture seule (pas de sync — les tables appartiennent à academic-service)
require('./models/Student');
require('./models/Grade');
require('./models/Attendance');
require('./models/Enrollment');

const kpiRoutes = require('./kpis/kpi.route');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

app.use('/api/kpis', kpiRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        // Pas de sequelize.sync() : ce service ne possède aucune table

        app.listen(port, () => {
            console.log(`Reporting service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
