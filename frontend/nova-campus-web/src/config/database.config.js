require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME     || 'novacampus',
    process.env.DB_USER     || 'nova',
    process.env.DB_PASSWORD || 'nova123',
    {
        host:    process.env.DB_HOST || 'postgres',
        port:    process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
    }
);

module.exports = sequelize;