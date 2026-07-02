const express = require("express");
const db = require("../db/db");
const { genId } = require("../utils/id");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function enrich(record) {
  const child = db.get("children").find({ id: record.childId }).value();
  return { ...record, childName: child ? `${child.firstName} ${child.lastName}` : "Bilinmiyor" };
}

// Belirli bir tarih + (opsiyonel) sinif icin yoklama listesi.
// Eger o tarihte cocuk icin kayit yoksa "kayit yok" olarak da donduruyoruz ki ekrandan isaretlenebilsin.
router.get("/", requireRole("admin", "teacher"), (req, res) => {
  const date = req.query.date || today();
  const classroomId = req.query.classroomId;

  let children = db.get("children").filter({ status: "aktif" }).value();
  if (classroomId) children = children.filter((c) => c.classroomId === classroomId);

  const records = db.get("attendance").filter({ date }).value();

  const result = children.map((child) => {
    const rec = records.find((r) => r.childId === child.id);
    return {
      id: rec ? rec.id : null,
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      classroomId: child.classroomId,
      date,
      status: rec ? rec.status : "kayıt yok",
      checkInTime: rec ? rec.checkInTime : null,
      checkOutTime: rec ? rec.checkOutTime : null,
      note: rec ? rec.note : ""
    };
  });

  res.json(result);
});

router.get("/child/:childId", requireRole("admin", "teacher", "parent"), (req, res) => {
  if (req.session.user.role === "parent") {
    const parent = db.get("parents").find({ id: req.session.user.id }).value();
    if (!parent || !parent.childIds.includes(req.params.childId)) {
      return res.status(403).json({ error: "Bu çocuğun kayıtlarını görme yetkiniz yok." });
    }
  }
  const records = db
    .get("attendance")
    .filter({ childId: req.params.childId })
    .orderBy("date", "desc")
    .take(60)
    .value();
  res.json(records);
});

// Yoklama isaretle/guncelle (upsert: childId+date kombinasyonu icin)
router.post("/", requireRole("admin", "teacher"), (req, res) => {
  const { childId, date, status, checkInTime, checkOutTime, note } = req.body || {};
  if (!childId || !date || !status) {
    return res.status(400).json({ error: "childId, date ve status gerekli." });
  }
  const child = db.get("children").find({ id: childId }).value();
  if (!child) return res.status(400).json({ error: "Geçersiz çocuk." });

  const existing = db.get("attendance").find({ childId, date });
  if (existing.value()) {
    existing.assign({ status, checkInTime: checkInTime || null, checkOutTime: checkOutTime || null, note: note || "" }).write();
    return res.json(enrich(existing.value()));
  }

  const record = {
    id: genId("att"),
    childId,
    classroomId: child.classroomId,
    date,
    status,
    checkInTime: checkInTime || null,
    checkOutTime: checkOutTime || null,
    note: note || ""
  };
  db.get("attendance").push(record).write();
  res.status(201).json(enrich(record));
});

module.exports = router;
