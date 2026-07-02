const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db/db");
const { genId } = require("../utils/id");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function enrich(parent) {
  const children = db
    .get("children")
    .filter((c) => parent.childIds.includes(c.id))
    .value()
    .map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName }));
  const { passwordHash, ...rest } = parent;
  return { ...rest, children };
}

// --- Yonetim (admin) tarafi: tum veli hesaplarini listele/yonet ---
router.get("/", requireRole("admin", "teacher"), (req, res) => {
  res.json(db.get("parents").value().map(enrich));
});

router.post("/", requireRole("admin"), (req, res) => {
  const { name, email, phone, password, childIds } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: "Ad ve e-posta gerekli." });
  const parent = {
    id: genId("par"),
    name,
    email,
    phone: phone || "",
    passwordHash: bcrypt.hashSync(password || "Veli2026!", 8),
    childIds: Array.isArray(childIds) ? childIds : []
  };
  db.get("parents").push(parent).write();
  parent.childIds.forEach((childId) => {
    const child = db.get("children").find({ id: childId });
    if (child.value() && !child.value().parentIds.includes(parent.id)) {
      child.get("parentIds").push(parent.id).write();
    }
  });
  res.status(201).json(enrich(parent));
});

router.put("/:id", requireRole("admin"), (req, res) => {
  const parent = db.get("parents").find({ id: req.params.id });
  if (!parent.value()) return res.status(404).json({ error: "Veli bulunamadı." });
  const { name, email, phone } = req.body || {};
  parent.assign({
    ...(name && { name }),
    ...(email && { email }),
    ...(phone !== undefined && { phone })
  }).write();
  res.json(enrich(parent.value()));
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  db.get("parents").remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

// --- Veli portali tarafi: oturum acmis velinin kendi bilgileri ---
router.get("/me/children", requireRole("parent"), (req, res) => {
  const parent = db.get("parents").find({ id: req.session.user.id }).value();
  if (!parent) return res.status(404).json({ error: "Veli bulunamadı." });
  const children = db
    .get("children")
    .filter((c) => parent.childIds.includes(c.id))
    .value()
    .map((c) => {
      const classroom = db.get("classrooms").find({ id: c.classroomId }).value();
      return { ...c, classroomName: classroom ? classroom.name : null };
    });
  res.json(children);
});

module.exports = router;
