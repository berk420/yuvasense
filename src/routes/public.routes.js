const express = require("express");
const db = require("../db/db");
const { genId } = require("../utils/id");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// Tanitim sitesindeki demo talep formundan gelen istekler (auth gerekmez)
router.post("/demo-request", (req, res) => {
  const { name, email, phone, daycareName, childCount, message } = req.body || {};
  if (!name || !email || !phone || !daycareName) {
    return res.status(400).json({ error: "Ad, e-posta, telefon ve kreş adı gerekli." });
  }

  const request = {
    id: genId("dmr"),
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    phone: String(phone).slice(0, 50),
    daycareName: String(daycareName).slice(0, 200),
    childCount: childCount || "",
    message: message ? String(message).slice(0, 1000) : "",
    createdAt: new Date().toISOString(),
    status: "yeni"
  };

  db.get("demoRequests").push(request).write();
  res.status(201).json({ ok: true });
});

router.get("/demo-requests", requireRole("admin"), (req, res) => {
  const list = db.get("demoRequests").orderBy("createdAt", "desc").value();
  res.json(list);
});

router.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

module.exports = router;
