/**
 * Oturum tabanli basit yetkilendirme.
 * req.session.user = { id, role: 'admin' | 'teacher' | 'parent', name, email }
 */

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Oturum açmanız gerekiyor." });
  }
  return next();
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor." });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
