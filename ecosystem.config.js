module.exports = {
  apps: [{
    name: 'omnex',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/omnex',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Memory management
    max_memory_restart: '1500M',

    // Logging
    error_file: '/var/log/pm2/omnex-error.log',
    out_file: '/var/log/pm2/omnex-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Graceful restart
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Auto restart on failure
    autorestart: true,
    max_restarts: 10,
    restart_delay: 4000,

    // Watch (disabled in production)
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs']
  }]
};
