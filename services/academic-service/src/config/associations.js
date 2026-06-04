const Student = require('../students/student.model');
const Enrollment = require('../students/enrollment.model');

// Un étudiant peut avoir plusieurs inscriptions
Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
