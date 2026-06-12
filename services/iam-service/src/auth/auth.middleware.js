const { verifyToken } = require('../common/utils/jwt.util');
const Session = require('../models/Session');

async function authenticate(req, res, next) {
    // Prefer httpOnly cookie (more secure - not accessible by JS), fall back to Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (decoded.sid) {
        try {
            const session = await Session.findByPk(decoded.sid);
            if (!session) {
                return res.status(401).json({ error: 'Session has been revoked' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Failed to validate session' });
        }
    }

    req.user = decoded;
    next();
}

module.exports = { authenticate };
