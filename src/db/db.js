const fs = require("fs");
const path = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const dataDir = path.join(__dirname, "..", "..", "data");
const dbFile = path.join(dataDir, "db.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const adapter = new FileSync(dbFile);
const db = low(adapter);

// Koleksiyonlarin varsayilan iskeleti - dosya yoksa veya bossa olusturulur
db.defaults({
  classrooms: [],
  staff: [],
  children: [],
  parents: [],
  attendance: [],
  invoices: [],
  users: [],
  demoRequests: [],
  meta: { seeded: false, seededAt: null }
}).write();

module.exports = db;
