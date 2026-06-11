const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};