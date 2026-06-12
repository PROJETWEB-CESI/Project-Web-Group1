const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Room = sequelize.define('Room', {
  room_id: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    field: 'room_id',
  },
  room_name: {
    type: DataTypes.STRING(120),
    field: 'room_name',
  },
  campus_id: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'campus_id',
  },
  building: {
    type: DataTypes.STRING(60),
    field: 'building',
  },
  floor: {
    type: DataTypes.SMALLINT,
    field: 'floor',
  },
  capacity: {
    type: DataTypes.INTEGER,
    field: 'capacity',
  },
  room_type: {
    type: DataTypes.STRING(40),
    field: 'room_type',
  },
  equipment: {
    type: DataTypes.TEXT,
    field: 'equipment',
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Available',
    field: 'status',
  },
}, {
  tableName: 'rooms',
  timestamps: false,
});

module.exports = Room;
