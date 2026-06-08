const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Student = sequelize.define('Student', {
    student_id:        { type: DataTypes.STRING(10), primaryKey: true },
    first_name:        { type: DataTypes.STRING(60) },
    last_name:         { type: DataTypes.STRING(60) },
    email:             { type: DataTypes.STRING(120), unique: true },
    phone:             { type: DataTypes.STRING(20) },
    date_of_birth:     { type: DataTypes.DATEONLY },
    campus_id:         { type: DataTypes.STRING(10) },
    program_id:        { type: DataTypes.STRING(10) },
    enrollment_year:   { type: DataTypes.SMALLINT },
    status:            { type: DataTypes.STRING(20), defaultValue: 'Active' },
    payment_status:    { type: DataTypes.STRING(20) },
    address:           { type: DataTypes.STRING(160) },
    city:              { type: DataTypes.STRING(80) },
    zip_code:          { type: DataTypes.STRING(10) },
    emergency_contact: { type: DataTypes.STRING(120) },
    emergency_phone:   { type: DataTypes.STRING(20) },
}, {
    tableName:  'students',
    timestamps: false,
});

module.exports = Student;