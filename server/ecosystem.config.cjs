module.exports = {
  apps: [
    {
      name: "chess-arena-server",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
