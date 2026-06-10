const AuthService = require('./auth.service');

// Parse duration strings like "15m", "2d", "7d" to milliseconds
function parseDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * multipliers[unit];
}

const accessTokenMaxAge = parseDuration(process.env.ACCESS_TOKEN_EXPIRES_IN || '15m') || 15 * 60 * 1000;
const refreshTokenMaxAge = parseDuration(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') || 7 * 24 * 60 * 60 * 1000;

function getCookieOptions(req) {
  return {
    httpOnly: true,
    secure: req?.secure === true,
    sameSite: 'lax',
    path: '/',
  };
}

async function register(req, res) {
  try {
    const { email, password, campusId, firstName, lastName } = req.body;
    const result = await AuthService.register(email, password, { campusId, firstName, lastName });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    // Set httpOnly cookies (best practice - not exposed to JS)
    const cookieOpts = getCookieOptions(req);
    res.cookie('accessToken', result.accessToken, {
      ...cookieOpts,
      maxAge: accessTokenMaxAge,
    });
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOpts,
      maxAge: refreshTokenMaxAge,
    });

    // Do not return tokens in body
    res.status(200).json({ user: result.user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const result = await AuthService.refreshTokens(refreshToken);

    // Set new cookies (rotating refresh token)
    const cookieOpts = getCookieOptions(req);
    res.cookie('accessToken', result.accessToken, {
      ...cookieOpts,
      maxAge: accessTokenMaxAge,
    });
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOpts,
      maxAge: refreshTokenMaxAge,
    });

    res.status(200).json({ message: 'Tokens refreshed' });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

async function logout(req, res) {
  const cookieOpts = getCookieOptions(req);
  res.clearCookie('accessToken', cookieOpts);
  res.clearCookie('refreshToken', cookieOpts);
  res.status(200).json({ message: 'Logged out' });
}

function validate(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.status(200).json({ user: req.user });
}

async function me(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await AuthService.getMe(req.user);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  validate,
  me,
};
