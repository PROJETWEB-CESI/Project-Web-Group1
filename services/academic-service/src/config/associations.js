const Student = require('../students/student.model');
const Enrollment = require('../students/enrollment.model');
const Course = require('../courses/course.model');

Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
