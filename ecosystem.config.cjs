module.exports = {
  apps: [
    {
      name: 'agent-dashboard',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --port 3002 --host',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
