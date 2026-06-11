const crypto = require('crypto');
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

// Set the double-submit CSRF cookie. Readable by JS so the frontend can echo
// it back in the X-CSRF-Token header on state-changing requests.
function setCsrfCookie(req, res, maxAge) {
  res.cookie('XSRF-TOKEN', crypto.randomBytes(32).toString('hex'), {
    httpOnly: false,
    secure: req?.secure === true,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
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
    const meta = { userAgent: req.headers['user-agent'], ip: req.ip };
    const result = await AuthService.login(email, password, meta);

    // Set httpOnly cookies (best practice - not exposed to JS)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: req?.secure === true,
      sameSite: 'lax',
      path: '/',
      maxAge: accessTokenMaxAge,
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: req?.secure === true,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshTokenMaxAge,
    });
    setCsrfCookie(req, res, refreshTokenMaxAge);

    // Do not return tokens in body
    res.status(200).json({ user: result.user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const meta = { userAgent: req.headers['user-agent'], ip: req.ip };
    const result = await AuthService.refreshTokens(refreshToken, meta);

    // Set new cookies (rotating refresh token)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: req?.secure === true,
      sameSite: 'lax',
      path: '/',
      maxAge: accessTokenMaxAge,
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: req?.secure === true,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshTokenMaxAge,
    });
    setCsrfCookie(req, res, refreshTokenMaxAge);

    res.status(200).json({ message: 'Tokens refreshed' });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

async function logout(req, res) {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await AuthService.revokeSessionByRefreshToken(refreshToken);
  }

  const cookieOpts = getCookieOptions(req);
  res.clearCookie('accessToken', cookieOpts);
  res.clearCookie('refreshToken', cookieOpts);
  res.clearCookie('XSRF-TOKEN', { ...cookieOpts, httpOnly: false });
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

async function updateMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await AuthService.updateProfile(req.user.id, req.body);
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function changePassword(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function listSessions(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const currentRefreshToken = req.cookies?.refreshToken;
    const sessions = await AuthService.listSessions(req.user.id, currentRefreshToken);
    res.json({ sessions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function revokeSession(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await AuthService.revokeSession(req.user.id, req.params.id);
    res.json({ message: 'Session revoked' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  validate,
  me,
  updateMe,
  changePassword,
  listSessions,
  revokeSession,
};
