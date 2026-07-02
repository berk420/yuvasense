const express = require("express");
const db = require("../db/db");
const { genId } = require("../utils/id");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function enrich(inv) {
  const child = db.get("children").find({ id: inv.childId }).value();
  return {
    ...inv,
    childName: child ? `${child.firstName} ${child.lastName}` : "Bilinmiyor",
    classroomId: child ? child.classroomId : null
  };
}

router.get("/", requireRole("admin", "teacher"), (req, res) => {
  const { status, childId, period } = req.query;
  let list = db.get("invoices").value();
  if (status) list = list.filter((i) => i.status === status);
  if (childId) list = list.filter((i) => i.childId === childId);
  if (period) list = list.filter((i) => i.period === period);
  res.json(list.map(enrich).sort((a, b) => (a.period < b.period ? 1 : -1)));
});

router.get("/child/:childId", requireRole("admin", "teacher", "parent"), (req, res) => {
  if (req.session.user.role === "parent") {
    const parent = db.get("parents").find({ id: req.session.user.id }).value();
    if (!parent || !parent.childIds.includes(req.params.childId)) {
      return res.status(403).json({ error: "Bu çocuğun faturalarını görme yetkiniz yok." });
    }
  }
  const list = db.get("invoices").filter({ childId: req.params.childId }).value();
  res.json(list.map(enrich).sort((a, b) => (a.period < b.period ? 1 : -1)));
});

router.post("/", requireRole("admin"), (req, res) => {
  const { childId, period, items, dueDate } = req.body || {};
  if (!childId || !period || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "childId, period ve items gerekli." });
  }
  const amount = items.reduce((sum, it) => sum + Number(it.amount || 0), 0);
  const invoice = {
    id: genId("inv"),
    childId,
    period,
    items,
    amount,
    status: "bekliyor",
    dueDate: dueDate || `${period}-10`,
    issuedDate: new Date().toISOString().slice(0, 10),
    paidDate: null
  };
  db.get("invoices").push(invoice).write();
  res.status(201).json(enrich(invoice));
});

router.put("/:id/mark-paid", requireRole("admin"), (req, res) => {
  const invoice = db.get("invoices").find({ id: req.params.id });
  if (!invoice.value()) return res.status(404).json({ error: "Fatura bulunamadı." });
  invoice.assign({ status: "ödendi", paidDate: new Date().toISOString().slice(0, 10) }).write();
  res.json(enrich(invoice.value()));
});

router.put("/:id", requireRole("admin"), (req, res) => {
  const invoice = db.get("invoices").find({ id: req.params.id });
  if (!invoice.value()) return res.status(404).json({ error: "Fatura bulunamadı." });
  const { status, items, dueDate } = req.body || {};
  const patch = {};
  if (status) patch.status = status;
  if (dueDate) patch.dueDate = dueDate;
  if (Array.isArray(items)) {
    patch.items = items;
    patch.amount = items.reduce((sum, it) => sum + Number(it.amount || 0), 0);
  }
  invoice.assign(patch).write();
  res.json(enrich(invoice.value()));
});

router.delete("/:id", requireRole("admin"), (req, res) => {
  db.get("invoices").remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

module.exports = router;
