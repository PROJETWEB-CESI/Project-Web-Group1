const jwt = require('jsonwebtoken');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

// Simple cookie parser - extract cookies from Cookie header
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name && rest.length > 0) {
            cookies[name] = rest.join('=');
        }
    });
    return cookies;
}

/**
 * Authentication middleware - verifies JWT token from cookies or Authorization header
 * Sets req.user with decoded token payload (id, email, role, campusId)
 */
async function authenticate(req, res, next) {
    // Prefer httpOnly cookie (more secure), fall back to Authorization header
    // Parse cookies from header if req.cookies not available (cookie-parser not used)
    const cookies = req.cookies || parseCookies(req.headers.cookie);
    let token = cookies?.accessToken;

    if (!token) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (decoded.sid) {
        try {
            const rows = await sequelize.query(
                'SELECT 1 FROM sessions WHERE id = :sid LIMIT 1',
                { replacements: { sid: decoded.sid }, type: QueryTypes.SELECT }
            );
            if (rows.length === 0) {
                return res.status(401).json({ error: 'Session has been revoked' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Failed to validate session' });
        }
    }

    req.user = decoded;
    next();
}

/**
 * Role-based authorization middleware
 * @param {string|string[]} allowedRoles - Single role or array of roles
 * @returns {Function} Express middleware
 */
function authorize(allowedRoles) {
    return (req, res, next) => {
        // First ensure user is authenticated
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role;
        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!rolesArray.includes(userRole)) {
            return res.status(403).json({
                error: 'Forbidden: Insufficient permissions'
            });
        }

        next();
    };
}

module.exports = { authenticate, authorize };
