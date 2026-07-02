const path = require("path");
const express = require("express");
const session = require("express-session");
const cors = require("cors");

const config = require("./config");
const db = require("./db/db");
const seed = require("./db/seed");

const authRoutes = require("./routes/auth.routes");
const classroomsRoutes = require("./routes/classrooms.routes");
const staffRoutes = require("./routes/staff.routes");
const childrenRoutes = require("./routes/children.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const invoicesRoutes = require("./routes/invoices.routes");
const parentsRoutes = require("./routes/parents.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const publicRoutes = require("./routes/public.routes");

// Veritabani bossa otomatik tohumla (ilk calistirmada demo verisi olusur)
if (!db.get("meta.seeded").value()) {
  seed();
}

const app = express();

app.set("trust proxy", 1); // IIS/Cloudflare arkasinda ters proxy

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  session({
    name: "yuvasense.sid",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 12, // 12 saat
      sameSite: "lax"
    }
  })
);

// Basit istek loglama
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// API rotalari
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/children", childrenRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/parents", parentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/public", publicRoutes);

// Tanitim (marketing) sitesi: Host header'a gore farkli statik klasor sun
const tanitimDir = path.join(__dirname, "..", "..", "YuvaSense-tanitim");
app.use((req, res, next) => {
  const host = (req.headers.host || "").toLowerCase();
  if (host.includes("tanitim")) {
    return express.static(tanitimDir)(req, res, () => {
      res.sendFile(path.join(tanitimDir, "index.html"), (err) => {
        if (err) next();
      });
    });
  }
  next();
});

// Statik frontend (public/)
app.use(express.static(path.join(__dirname, "..", "public")));

// API 404
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Bulunamadı." });
});

// Diger tum yollar icin index'e dus (basit SPA-benzeri fallback degil, MPA oldugu icin sadece kok yol)
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(__dirname, "..", "public", "404.html"), (err) => {
      if (err) next();
    });
  }
  next();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Sunucu hatası." });
});

module.exports = app;
