const express = require("express");
const db = require("../db/db");
const { genId } = require("../utils/id");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function withCounts(classroom) {
  const childCount = db.get("children").filter({ classroomId: classroom.id, status: "aktif" }).size().value();
  const teacher = db.get("staff").find({ classroomId: classroom.id, role: "Öğretmen" }).value();
  return { ...classroom, childCount, teacherName: teacher ? teacher.name : null };
}

router.get("/", requireRole("admin", "teacher"), (req, res) => {
  const classrooms = db.get("classrooms").value().map(withCounts);
  res.json(classrooms);
});

router.get("/:id", requireRole("admin", "teacher"), (req, res) => {
  const classroom = db.get("classrooms").find({ id: req.params.id }).value();
  if (!classroom) return res.status(404).json({ error: "Sınıf bulunamadı." });
  res.json(withCounts(classroom));
});

router.post("/", requireRole("admin"), (req, res) => {
  const { name, ageGroup, capacity, color } = req.body || {};
  if (!name || !ageGroup) {
    return res.status(400).json({ error: "Sınıf adı ve yaş grubu gerekli." });
  }
  const classroom = {
    id: genId("cls"),
    name,
    ageGroup,
    capacity: Number(capacity) || 15,
    color: color || "#1e8a78"
  };
  db.get("classrooms").push(classroom).write();
  res.status(201).json(classroom);
});

router.put("/:id", requireRole("admin"), (req, res) => {
  const classroom = db.get("classrooms").find({ id: req.params.id });
  if (!classroom.value()) return res.status(404).json({ error: "Sınıf bulunamadı." });
  const { name, ageGroup, capacity, color } = req.body || {};
  classroom.assign({
    ...(name && { name }),
    ...(ageGroup && { ageGroup }),
    ...(capacity && { capacity: Number(capacity) }),
    ...(color && { color })
  }).write();
  res.json(withCounts(classroom.value()));
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  const inUse = db.get("children").some({ classroomId: req.params.id }).value();
  if (inUse) {
    return res.status(400).json({ error: "Bu sınıfa kayıtlı çocuklar var, önce onları taşıyın." });
  }
  db.get("classrooms").remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

module.exports = router;
