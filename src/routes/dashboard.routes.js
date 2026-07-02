const express = require("express");
const db = require("../db/db");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

router.get("/summary", requireRole("admin", "teacher"), (req, res) => {
  const classrooms = db.get("classrooms").value();
  const children = db.get("children").value();
  const staff = db.get("staff").value();
  const activeChildren = children.filter((c) => c.status === "aktif");

  const todayStr = today();
  const todaysAttendance = db.get("attendance").filter({ date: todayStr }).value();
  const presentToday = todaysAttendance.filter((a) => a.status === "geldi" || a.status === "geç geldi").length;
  const attendanceRate = activeChildren.length
    ? Math.round((presentToday / activeChildren.length) * 100)
    : 0;

  const invoices = db.get("invoices").value();
  const overdue = invoices.filter((i) => i.status === "gecikmiş");
  const pending = invoices.filter((i) => i.status === "bekliyor");
  const overdueAmount = overdue.reduce((sum, i) => sum + i.amount, 0);

  const classroomOccupancy = classrooms.map((c) => {
    const count = activeChildren.filter((ch) => ch.classroomId === c.id).length;
    return { id: c.id, name: c.name, capacity: c.capacity, count, color: c.color };
  });

  const recentDemoRequests = db
    .get("demoRequests")
    .orderBy("createdAt", "desc")
    .take(5)
    .value();

  res.json({
    totals: {
      children: activeChildren.length,
      staff: staff.length,
      classrooms: classrooms.length,
      attendanceRate,
      overdueInvoices: overdue.length,
      overdueAmount,
      pendingInvoices: pending.length
    },
    classroomOccupancy,
    recentDemoRequests
  });
});

module.exports = router;
