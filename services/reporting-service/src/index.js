require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');

// Chargement des modèles en lecture seule (pas de sync — les tables appartiennent à academic-service)
require('./models/Student');
require('./models/Grade');
require('./models/Attendance');
require('./models/Enrollment');

const kpiRoutes         = require('./kpis/kpi.route');
const comparisonRoutes  = require('./comparison/comparison.route');
const programmeRoutes   = require('./programmes/programme.route');
const retentionRoutes   = require('./retention/retention.route');
const { authenticate, authorize } = require('./middleware/auth.middleware');

const app = express();
app.disable('x-powered-by');
const port = process.env.API_PORT || 3000;

// Trust reverse proxy headers (X-Forwarded-Proto, etc.) - needed when behind nginx
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Reporting endpoints are executive/admin only
app.use('/kpis', authenticate, authorize(['executive', 'admin']), kpiRoutes);
app.use('/comparison', authenticate, authorize(['executive', 'admin']), comparisonRoutes);
app.use('/programmes', authenticate, authorize(['executive', 'admin']), programmeRoutes);
app.use('/retention', authenticate, authorize(['executive', 'admin']), retentionRoutes);

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
