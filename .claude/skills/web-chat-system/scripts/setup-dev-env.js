#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * Usage: node setup-dev-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Web Chat System development environment...\n');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`✓ Created directory: ${dir}`, 'green');
  } else {
    log(`○ Directory exists: ${dir}`, 'yellow');
  }
}

function createFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✓ Created file: ${filePath}`, 'green');
  } else {
    log(`○ File exists: ${filePath}`, 'yellow');
  }
}

// Create necessary directories
log('Creating directory structure...\n', 'blue');
createDirectory('./server/database');
createDirectory('./server/uploads');
createDirectory('./server/logs');
createDirectory('./client/logs');
createDirectory('./backups');

// Server environment file
log('\nCreating environment files...\n', 'blue');
const serverEnv = `# Server Environment Configuration
PORT=3001
DATABASE_PATH=./database/chat.db
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
ENABLE_QUERY_LOGGING=true
`;
createFile('./server/.env', serverEnv);

// Client environment file
const clientEnv = `# Client Environment Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Enable debugging
VITE_ENABLE_LOGGING=true
VITE_ENABLE_ERROR_REPORTING=false
`;
createFile('./client/.env', clientEnv);

// Create .gitignore additions
const gitignoreAdditions = `
# Environment files
.env
.env.local
.env.production

# Database
*.db
*.db-journal
*.db-wal
*.db-shm

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Uploads
uploads/*
!uploads/.gitkeep

# Backups
backups/
*.backup
`;
const gitignorePath = './.gitignore';
if (fs.existsSync(gitignorePath)) {
  const currentGitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!currentGitignore.includes('Environment files')) {
    fs.appendFileSync(gitignorePath, gitignoreAdditions);
    log('✓ Updated .gitignore', 'green');
  } else {
    log('○ .gitignore already contains entries', 'yellow');
  }
}

// Create .gitkeep files for empty directories
createFile('./server/uploads/.gitkeep', '');

// Create PM2 ecosystem file
log('\nCreating PM2 configuration...\n', 'blue');
const ecosystemConfig = `module.exports = {
  apps: [
    {
      name: 'chat-server',
      script: './server/dist/app.js',
      cwd: process.cwd(),
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
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
      restart_delay: 4000
    }
  ]
};
`;
createFile('./ecosystem.config.js', ecosystemConfig);

// Create Nginx configuration template
log('\nCreating Nginx configuration template...\n', 'blue');
const nginxConfig = `# Nginx Configuration for Web Chat System
# Copy this to /etc/nginx/sites-available/chat-system

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    location / {
        root /var/www/chat-system/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SSE endpoints (critical configuration)
    location /api/sse {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control no-cache;
        proxy_set_header X-Accel-Buffering no;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:3001;
        client_max_body_size 10M;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Logging
    access_log /var/log/nginx/chat-system-access.log;
    error_log /var/log/nginx/chat-system-error.log;
}

# HTTPS Configuration (uncomment and configure for production)
# server {
#     listen 443 ssl http2;
#     server_name yourdomain.com;
#
#     ssl_certificate /path/to/cert.pem;
#     ssl_certificate_key /path/to/key.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#
#     # ... same location blocks as above ...
# }
#
# # Redirect HTTP to HTTPS
# server {
#     listen 80;
#     server_name yourdomain.com;
#     return 301 https://$server_name$request_uri;
# }
`;
createFile('./nginx.conf.template', nginxConfig);

// Create deployment checklist
log('\nCreating deployment checklist...\n', 'blue');
const deploymentChecklist = `# Deployment Checklist

## Pre-Deployment
- [ ] Review code changes
- [ ] Update version numbers
- [ ] Test on development environment
- [ ] Update environment variables
- [ ] Backup current database
- [ ] Review security settings

## Deployment Steps
- [ ] Build frontend: \`cd client && bun run build\`
- [ ] Build backend: \`cd server && bun run build\`
- [ ] Upload files to server
- [ ] Set proper file permissions
- [ ] Update Nginx configuration
- [ ] Restart services with PM2
- [ ] Test API endpoints
- [ ] Test SSE connections
- [ ] Test file uploads

## Post-Deployment
- [ ] Verify database migration
- [ ] Check application logs
- [ ] Monitor error rates
- [ ] Test all features
- [ ] Update documentation
- [ ] Notify team of deployment

## Rollback Plan
- [ ] Document rollback steps
- [ ] Have recent backup ready
- [ ] Test rollback procedure
- [ ] Prepare emergency contacts

## Monitoring Setup
- [ ] Configure logging
- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure alerts
`;
createFile('./DEPLOYMENT_CHECKLIST.md', deploymentChecklist);

// Create development guide
const devGuide = `# Development Guide

## Getting Started

1. Install dependencies:
   \`\`\`bash
   bun run install:all
   \`\`\`

2. Set up environment:
   \`\`\`bash
   # Environment files are already created for you
   # Review and modify if needed:
   # - server/.env
   # - client/.env
   \`\`\`

3. Initialize database:
   \`\`\`bash
   cd server
   bun run db:init
   \`\`\`

4. Start development servers:
   \`\`\`bash
   bun run dev
   \`\`\`

## Available Scripts

### Root directory
- \`bun run dev\` - Start both frontend and backend
- \`bun run install:all\` - Install all dependencies
- \`bun run build\` - Build both frontend and backend
- \`bun start\` - Start production servers

### Server directory
- \`bun run dev\` - Start backend server (port 3001)
- \`bun run build\` - Build TypeScript
- \`bun run start\` - Start production server
- \`bun run db:init\` - Initialize database
- \`bun run db:migrate\` - Run migrations

### Client directory
- \`bun run dev\` - Start frontend server (port 5173)
- \`bun run build\` - Build for production
- \`bun run preview\` - Preview production build

## Database Management

### Manual Commands
\`\`\`bash
# Open database
sqlite3 server/database/chat.db

# View tables
.tables

# View schema
.schema <table_name>

# Query
SELECT * FROM messages LIMIT 10;

# Exit
.quit
\`\`\`

### Backup
\`\`\`bash
# Manual backup
cp server/database/chat.db backups/chat-\$(date +%Y%m%d_%H%M%S).db

# Automated backup (make script executable first)
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh
\`\`\`

### Restore
\`\`\`bash
# Manual restore
cp backups/chat-20240101_120000.db server/database/chat.db

# Automated restore
chmod +x scripts/restore-database.sh
./scripts/restore-database.sh backups/chat-20240101_120000.db
\`\`\`

## API Testing

### Using curl
\`\`\`bash
# Get public room
curl http://localhost:3001/api/rooms/public

# Create room
curl -X POST http://localhost:3001/api/rooms/create \\
  -H "Content-Type: application/json" \\
  -d '{"roomCode":"123456","userId":"testuser"}'

# Send message
curl -X POST http://localhost:3001/api/messages/send \\
  -H "Content-Type: application/json" \\
  -d '{"roomId":1,"userId":"testuser","content":"Hello!"}'
\`\`\`

### Testing SSE connection
\`\`\`bash
curl -N http://localhost:3001/api/sse/0?userId=testuser
\`\`\`

## Common Issues

### Port already in use
\`\`\`bash
# Linux/macOS
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
\`\`\`

### Database locked
\`\`\`bash
# Remove journal files
rm server/database/chat.db-journal
rm server/database/chat.db-wal
\`\`\`

### Build errors
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
rm -rf client/node_modules client/bun.lockb
rm -rf server/node_modules server/bun.lockb
bun run install:all
\`\`\`

## Testing

### Run tests
\`\`\`bash
# Frontend tests
cd client
bun test

# Backend tests
cd server
bun test
\`\`\`

### Linting
\`\`\`bash
# Frontend
cd client
bun run lint

# Backend
cd server
bun run lint
\`\`\`

## Debugging

### Enable debug logging
Set \`LOG_LEVEL=debug\` in server/.env

### View PM2 logs
\`\`\`bash
pm2 logs chat-server
pm2 monit
\`\`\`

### View Nginx logs
\`\`\`bash
tail -f /var/log/nginx/chat-system-error.log
tail -f /var/log/nginx/chat-system-access.log
\`\`\`

## Useful Commands

### Check file sizes
\`\`\`bash
du -sh server/database/chat.db
du -sh server/uploads
\`\`\`

### Monitor processes
\`\`\`bash
pm2 status
pm2 monit
\`\`\`

### Check disk space
\`\`\`bash
df -h
\`\`\`

## Next Steps

1. Review the technical documentation: \`Technical.md\`
2. Check project structure: \`Structure.md\`
3. Review deployment guide: \`Deployment.md\`
4. Set up monitoring and alerts
5. Configure CI/CD pipeline
`;
createFile('./DEVELOPMENT_GUIDE.md', devGuide);

// Final summary
log('\n' + '='.repeat(60), 'blue');
log('✅ Development environment setup complete!', 'green');
log('='.repeat(60) + '\n', 'blue');

log('Next steps:', 'blue');
log('  1. Review and update environment files (.env)', 'yellow');
log('  2. Install dependencies: bun run install:all', 'yellow');
log('  3. Initialize database: cd server && bun run db:init', 'yellow');
log('  4. Start development servers: bun run dev', 'yellow');
log('  5. Open http://localhost:5173 in your browser', 'yellow');

log('\nUseful files created:', 'blue');
log('  - server/.env - Server configuration', 'reset');
log('  - client/.env - Client configuration', 'reset');
log('  - ecosystem.config.js - PM2 configuration', 'reset');
log('  - nginx.conf.template - Nginx configuration', 'reset');
log('  - DEPLOYMENT_CHECKLIST.md - Deployment checklist', 'reset');
log('  - DEVELOPMENT_GUIDE.md - Development guide', 'reset');

log('\nScripts created:', 'blue');
log('  - scripts/backup-database.sh - Database backup', 'reset');
log('  - scripts/restore-database.sh - Database restore', 'reset');

log('\nMake scripts executable:', 'yellow');
log('  chmod +x scripts/*.sh', 'reset');

log('\nHappy coding! 🎉\n', 'green');
