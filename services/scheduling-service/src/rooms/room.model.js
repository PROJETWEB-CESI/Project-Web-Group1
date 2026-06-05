const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Room = sequelize.define('Room', {
  room_id: {
    type: DataTypes.STRING(10),
    primaryKey: true,
  },
  room_name: {
    type: DataTypes.STRING(120),
  },
  campus_id: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  building: {
    type: DataTypes.STRING(60),
  },
  floor: {
    type: DataTypes.SMALLINT,
  },
  capacity: {
    type: DataTypes.INTEGER,
  },
  room_type: {
    type: DataTypes.STRING(40),
  },
  equipment: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Available',
  },
}, {
  tableName: 'rooms',
  timestamps: false,
});

module.exports = Room;