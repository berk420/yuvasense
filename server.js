const app = require("./src/app");
const config = require("./src/config");

const server = app.listen(config.port, () => {
  console.log(`[YuvaSense] Sunucu ${config.port} portunda çalışıyor (env: ${config.nodeEnv})`);
});

process.on("SIGTERM", () => {
  console.log("[YuvaSense] SIGTERM alındı, sunucu kapatılıyor...");
  server.close(() => process.exit(0));
});

process.on("unhandledRejection", (reason) => {
  console.error("[YuvaSense] Unhandled rejection:", reason);
});
