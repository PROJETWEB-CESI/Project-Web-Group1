const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const User = sequelize.define('User', {
    email:        { type: DataTypes.STRING(120), unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING,      allowNull: false },
    role:         { type: DataTypes.STRING(20),  defaultValue: 'student' },
});

module.exports = User;
