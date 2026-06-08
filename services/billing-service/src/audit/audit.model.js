const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    campusId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    userRole: { type: DataTypes.STRING(50), allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entityType: { type: DataTypes.STRING(50), allowNull: false },
    entityId: { type: DataTypes.INTEGER, allowNull: true },
    diff: { type: DataTypes.JSON, allowNull: true },
    ip: { type: DataTypes.STRING(45), allowNull: true },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = AuditLog;
