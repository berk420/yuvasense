const express = require("express");
const db = require("../db/db");
const { genId } = require("../utils/id");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function enrich(child) {
  const classroom = db.get("classrooms").find({ id: child.classroomId }).value();
  const parents = db
    .get("parents")
    .filter((p) => child.parentIds.includes(p.id))
    .value()
    .map((p) => ({ id: p.id, name: p.name, email: p.email, phone: p.phone }));
  return { ...child, classroomName: classroom ? classroom.name : null, parents };
}

router.get("/", requireRole("admin", "teacher"), (req, res) => {
  const { classroomId, status, q } = req.query;
  let list = db.get("children").value();
  if (classroomId) list = list.filter((c) => c.classroomId === classroomId);
  if (status) list = list.filter((c) => c.status === status);
  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(needle));
  }
  res.json(list.map(enrich));
});

router.get("/:id", requireRole("admin", "teacher"), (req, res) => {
  const child = db.get("children").find({ id: req.params.id }).value();
  if (!child) return res.status(404).json({ error: "Çocuk bulunamadı." });
  res.json(enrich(child));
});

router.post("/", requireRole("admin"), (req, res) => {
  const { firstName, lastName, birthDate, classroomId, allergies, notes } = req.body || {};
  if (!firstName || !lastName || !classroomId) {
    return res.status(400).json({ error: "Ad, soyad ve sınıf gerekli." });
  }
  const classroom = db.get("classrooms").find({ id: classroomId }).value();
  if (!classroom) return res.status(400).json({ error: "Geçersiz sınıf." });

  const child = {
    id: genId("chd"),
    firstName,
    lastName,
    birthDate: birthDate || null,
    classroomId,
    allergies: allergies || null,
    notes: notes || "",
    enrollmentDate: new Date().toISOString().slice(0, 10),
    status: "aktif",
    parentIds: []
  };
  db.get("children").push(child).write();
  res.status(201).json(enrich(child));
});

router.put("/:id", requireRole("admin", "teacher"), (req, res) => {
  const child = db.get("children").find({ id: req.params.id });
  if (!child.value()) return res.status(404).json({ error: "Çocuk bulunamadı." });
  const { firstName, lastName, birthDate, classroomId, allergies, notes, status } = req.body || {};
  child.assign({
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(birthDate !== undefined && { birthDate }),
    ...(classroomId && { classroomId }),
    ...(allergies !== undefined && { allergies }),
    ...(notes !== undefined && { notes }),
    ...(status && { status })
  }).write();
  res.json(enrich(child.value()));
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  db.get("children").remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

// Bir cocuga veli baglama
router.post("/:id/parents", requireRole("admin"), (req, res) => {
  const child = db.get("children").find({ id: req.params.id });
  if (!child.value()) return res.status(404).json({ error: "Çocuk bulunamadı." });
  const { name, email, phone, password } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: "Veli adı ve e-postası gerekli." });

  const bcrypt = require("bcryptjs");
  const parent = {
    id: genId("par"),
    name,
    email,
    phone: phone || "",
    passwordHash: bcrypt.hashSync(password || "Veli2026!", 8),
    childIds: [child.value().id]
  };
  db.get("parents").push(parent).write();
  child.get("parentIds").push(parent.id).write();
  res.status(201).json(enrich(child.value()));
});

module.exports = router;
