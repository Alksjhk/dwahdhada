module.exports = {
  apps: [
    {
      name: 'chat-server',
      script: './server/dist/app.js',
      cwd: process.cwd(),
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_PATH: './server/database/chat.db',
        UPLOAD_DIR: './server/uploads',
        MAX_FILE_SIZE: 10485760,
        CORS_ORIGIN: 'https://yourdomain.com'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        DATABASE_PATH: './server/database/chat.db',
        UPLOAD_DIR: './server/uploads',
        MAX_FILE_SIZE: 10485760,
        CORS_ORIGIN: 'http://localhost:5173',
        LOG_LEVEL: 'debug'
      },
      error_file: './server/logs/server-error.log',
      out_file: './server/logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true
    }
  ]
};
