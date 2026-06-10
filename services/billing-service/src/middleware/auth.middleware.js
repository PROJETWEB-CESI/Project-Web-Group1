const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecret';

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
function authenticate(req, res, next) {
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

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
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

/**
 * Student ownership middleware - ensures student can only access their own data
 * Checks that req.params.studentId matches req.user.id when user role is 'student'
 * @param {string} paramName - The parameter name containing the student ID (default: 'studentId')
 * @returns {Function} Express middleware
 */
function checkStudentOwnership(paramName = 'studentId') {
    return (req, res, next) => {
        // Only enforce for student role
        if (req.user && req.user.role === 'student') {
            const requestStudentId = req.params[paramName];
            if (requestStudentId && requestStudentId !== req.user.id) {
                return res.status(403).json({
                    error: 'Forbidden: Students can only access their own data'
                });
            }
        }
        next();
    };
}

module.exports = { authenticate, authorize, checkStudentOwnership };
