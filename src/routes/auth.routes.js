const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db/db");

const router = express.Router();

// Personel / yonetici girisi
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "E-posta ve şifre gerekli." });
  }
  const user = db
    .get("users")
    .find((u) => u.email.toLowerCase() === String(email).toLowerCase())
    .value();

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "E-posta veya şifre hatalı." });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  return res.json({ user: req.session.user });
});

// Veli girisi
router.post("/parent-login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "E-posta ve şifre gerekli." });
  }
  const parent = db
    .get("parents")
    .find((p) => p.email.toLowerCase() === String(email).toLowerCase())
    .value();

  if (!parent || !bcrypt.compareSync(password, parent.passwordHash)) {
    return res.status(401).json({ error: "E-posta veya şifre hatalı." });
  }

  req.session.user = { id: parent.id, name: parent.name, email: parent.email, role: "parent" };
  return res.json({ user: req.session.user });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Oturum yok." });
  }
  return res.json({ user: req.session.user });
});

module.exports = router;
