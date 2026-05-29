const { hashPassword, comparePassword } = require('../common/utils/bcrypt.util');
const { generateToken } = require('../common/utils/jwt.util');
const User = require('../models/User');

async function register(email, password){
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({ email, passwordHash: hashedPassword });
    return { email: newUser.email, role: newUser.role };
}

async function login(email, password){
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    const token = generateToken({ email: user.email, role: user.role });
    return { token };
}

module.exports = { register, login };