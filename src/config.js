module.exports = {
  port: parseInt(process.env.PORT, 10) || 4101,
  sessionSecret: process.env.SESSION_SECRET || "yuvasense-dev-secret-change-me",
  nodeEnv: process.env.NODE_ENV || "development",
  // Tanitim (marketing) sitesinin origin'i - CORS icin
  corsOrigins: [
    "https://yuvasense-tanitim.testprocess.com.tr",
    "https://yuvasense.testprocess.com.tr",
    "http://localhost:4101",
    "http://localhost:5173"
  ]
};
