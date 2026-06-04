require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const authRoutes = require('./auth/auth.route');
const userRoutes = require('./users/user.route');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Auth endpoints are reached via gateway /api/auth/* which strips prefix,
// so mount at root to match incoming /login, /register, /validate etc.
app.use(authRoutes);

// User management mounted at /users so that gateway /api/auth/users
// (prefix-stripped) reaches here.
app.use('/users', userRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    app.listen(port, () => {
      console.log(`Auth service running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();