const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit cookie CSRF protection for cookie-authenticated requests.
 * Requests authenticated via an Authorization header (service-to-service
 * calls, scripts) carry no ambient credential and are not subject to CSRF.
 */
function csrfProtection(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next();

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) return next();

    if (!req.cookies?.accessToken) return next();

    const cookieToken = req.cookies?.['XSRF-TOKEN'];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'Invalid or missing CSRF token' });
    }

    next();
}

module.exports = { csrfProtection };
