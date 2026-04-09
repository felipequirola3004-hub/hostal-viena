// PM2 ecosystem — iniciar con: pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'hostal-viena',
      script: 'server/index.js',
      cwd: './',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
