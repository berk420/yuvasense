module.exports = {
  apps: [
    {
      name: "yuvasense",
      script: "server.js",
      cwd: "C:/inetpub/wwwroot/YuvaSense",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 4101,
        SESSION_SECRET: "yuvasense-prod-s3cr3t-2026"
      },
      error_file: "C:/inetpub/wwwroot/YuvaSense/logs/error.log",
      out_file: "C:/inetpub/wwwroot/YuvaSense/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
