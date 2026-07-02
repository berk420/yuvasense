const express = require("express");
const db = require("../db/db");
const { genId } = require("../utils/id");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function withClassroom(member) {
  const classroom = member.classroomId ? db.get("classrooms").find({ id: member.classroomId }).value() : null;
  return { ...member, classroomName: classroom ? classroom.name : null };
}

router.get("/", requireRole("admin", "teacher"), (req, res) => {
  res.json(db.get("staff").value().map(withClassroom));
});

router.get("/:id", requireRole("admin", "teacher"), (req, res) => {
  const member = db.get("staff").find({ id: req.params.id }).value();
  if (!member) return res.status(404).json({ error: "Personel bulunamadı." });
  res.json(withClassroom(member));
});

router.post("/", requireRole("admin"), (req, res) => {
  const { name, role, email, phone, classroomId, hireDate } = req.body || {};
  if (!name || !role || !email) {
    return res.status(400).json({ error: "Ad, rol ve e-posta gerekli." });
  }
  const member = {
    id: genId("stf"),
    name,
    role,
    email,
    phone: phone || "",
    classroomId: classroomId || null,
    hireDate: hireDate || new Date().toISOString().slice(0, 10)
  };
  db.get("staff").push(member).write();
  res.status(201).json(member);
});

router.put("/:id", requireRole("admin"), (req, res) => {
  const member = db.get("staff").find({ id: req.params.id });
  if (!member.value()) return res.status(404).json({ error: "Personel bulunamadı." });
  const { name, role, email, phone, classroomId, hireDate } = req.body || {};
  member.assign({
    ...(name && { name }),
    ...(role && { role }),
    ...(email && { email }),
    ...(phone !== undefined && { phone }),
    ...(classroomId !== undefined && { classroomId }),
    ...(hireDate && { hireDate })
  }).write();
  res.json(withClassroom(member.value()));
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  db.get("staff").remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

module.exports = router;
