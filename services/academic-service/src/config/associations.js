const Student = require('../students/student.model');
const Enrollment = require('../students/enrollment.model');
const Course = require('../courses/course.model');
const Campus = require('../students/campus.model');
const Program = require('../students/program.model');

Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Student.belongsTo(Campus, { foreignKey: 'campusId', as: 'campus' });
Student.belongsTo(Program, { foreignKey: 'programId', as: 'program' });
