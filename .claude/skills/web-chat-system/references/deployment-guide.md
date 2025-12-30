# Deployment Guide

Complete deployment instructions for the Web Chat System in various environments.

## Table of Contents
- [Environment Requirements](#environment-requirements)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Nginx Configuration](#nginx-configuration)
- [PM2 Process Management](#pm2-process-management)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

---

## Environment Requirements

### System Requirements

**Operating System:**
- Linux (Ubuntu 20.04+ recommended)
- Windows Server 2019+
- macOS (for development)

**Hardware:**
- Minimum: 1 CPU, 512MB RAM
- Recommended: 2+ CPUs, 2GB RAM
- Storage: 1GB minimum (more for message history)

### Software Requirements

**Node.js:**
```bash
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
```

**Bun (Package Manager):**
```bash
bun --version  # >= 1.0.0
```

**Additional Tools:**
- Git
- PM2 (production process manager)
- Nginx (reverse proxy)
- SSL certificate (for HTTPS)

---

## Development Deployment

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd dwahdhada-main

# Install all dependencies
bun run install:all

# Start development servers
bun run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Environment Configuration

**Backend** (`server/.env`):
```env
PORT=3001
DATABASE_PATH=./database/chat.db
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

**Frontend** (`client/.env`):
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Separate Service Start

```bash
# Backend only
cd server
bun run dev

# Frontend only
cd client
bun run dev
```

### Development Scripts

```bash
# Install dependencies
bun run install:all    # Install both frontend and backend
bun install             # Root dependencies

# Development
bun run dev             # Start both
bun run server:dev      # Backend only
bun run client:dev      # Frontend only

# Build
bun run build           # Build both
bun run server:build    # Build backend
bun run client:build    # Build frontend

# Production
bun start              # Start both in production mode
```

---

## Production Deployment

### 1. Preparation

```bash
# Update dependencies
cd client && bun install
cd ../server && bun install

# Build frontend
cd client
bun run build

# Build backend
cd server
bun run build
```

### 2. Database Setup

```bash
cd server

# Initialize database
bun run db:init

# Run migrations
bun run db:migrate
```

### 3. Upload Configuration

```bash
# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

### 4. Environment Files

**Production Backend** (`server/.env`):
```env
PORT=3001
DATABASE_PATH=/var/www/chat-system/database/chat.db
NODE_ENV=production
UPLOAD_DIR=/var/www/chat-system/uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://yourdomain.com
```

**Production Frontend** (configure during build):
```bash
# Build with production API URL
VITE_API_BASE_URL=https://yourdomain.com/api bun run build
```

### 5. Directory Structure

```
/var/www/chat-system/
├── client/
│   └── dist/              # Built frontend
├── server/
│   ├── dist/              # Built backend
│   ├── uploads/           # File uploads
│   └── database/
│       └── chat.db        # SQLite database
├── logs/                  # Application logs
└── .env                  # Environment variables
```

### 6. Set Permissions

```bash
# Application directory
chown -R www-data:www-data /var/www/chat-system
chmod -R 755 /var/www/chat-system

# Database and uploads
chmod 660 /var/www/chat-system/server/database/chat.db
chmod 775 /var/www/chat-system/server/uploads
```

---

## Nginx Configuration

### Basic Configuration

**File:** `/etc/nginx/sites-available/chat-system`

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    location / {
        root /var/www/chat-system/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SSE endpoints (critical configuration)
    location /api/sse {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # SSE-specific headers
        proxy_set_header Connection '';
        proxy_set_header Cache-Control no-cache;
        proxy_set_header X-Accel-Buffering no;
        proxy_buffering off;
        
        # Prevent timeout
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:3001;
        
        # Allow large files
        client_max_body_size 10M;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Logging
    access_log /var/log/nginx/chat-system-access.log;
    error_log /var/log/nginx/chat-system-error.log;
}
```

### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/chat-system /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Nginx Optimization

```nginx
# In http block
http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;

    # Worker processes
    worker_processes auto;
    worker_connections 1024;

    # Buffer sizes
    client_body_buffer_size 10M;
    client_max_body_size 10M;
}
```

---

## PM2 Process Management

### Install PM2

```bash
sudo npm install -g pm2
```

### Ecosystem Configuration

**File:** `ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'chat-server',
      script: './server/dist/app.js',
      cwd: '/var/www/chat-system',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ]
};
```

### Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Or start single app
pm2 start /var/www/chat-system/server/dist/app.js --name chat-server

# View status
pm2 status

# View logs
pm2 logs chat-server

# Stop application
pm2 stop chat-server

# Restart application
pm2 restart chat-server

# Delete application
pm2 delete chat-server
```

### PM2 Startup Script

```bash
# Save process list
pm2 save

# Generate startup script
pm2 startup

# Execute the command shown (sudo env PATH=...)
```

### PM2 Monitoring

```bash
# Monitor in real-time
pm2 monit

# Get detailed information
pm2 show chat-server

# Get metrics
pm2 show chat-server
```

---

## Docker Deployment

### Dockerfile (Backend)

**File:** `server/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build TypeScript
RUN bun run build

# Create necessary directories
RUN mkdir -p uploads database

# Expose port
EXPOSE 3001

# Start application
CMD ["bun", "start"]
```

### Dockerfile (Frontend)

**File:** `client/Dockerfile`

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build application
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: chat-server
    ports:
      - "3001:3001"
    volumes:
      - ./server/uploads:/app/uploads
      - ./server/database:/app/database
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_PATH=/app/database/chat.db
      - UPLOAD_DIR=/app/uploads
    restart: unless-stopped

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      container_name: chat-client
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  uploads:
  database:
```

### Run Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## Cloud Deployment

### AWS EC2

1. **Launch Instance:**
   - Ubuntu 20.04 LTS
   - t3.medium (minimum)
   - Security groups: 80, 443, 22

2. **Deploy Application:**
   ```bash
   # SSH into instance
   ssh -i key.pem ubuntu@your-ip

   # Clone repository
   git clone <repo-url>
   cd dwahdhada-main

   # Follow deployment steps from above
   ```

3. **Configure Security:**
   - Open ports 80 (HTTP), 443 (HTTPS)
   - Restrict SSH access to your IP
   - Configure firewall rules

### DigitalOcean

1. **Create Droplet:**
   - Ubuntu 20.04
   - 2GB RAM, 1 CPU ($6/month)
   - Enable monitoring

2. **Deploy:**
   - Follow same deployment steps
   - Use DigitalOcean App Platform for easier setup

### Heroku

1. **Create app:**
   ```bash
   heroku create chat-system
   ```

2. **Prepare:**
   - Add `Procfile`
   - Configure environment variables
   - Add buildpacks

3. **Deploy:**
   ```bash
   git push heroku main
   ```

---

## SSL/HTTPS Setup

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Manual SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring and Logging

### Application Logging

**Backend Logging:**

```typescript
// server/src/utils/logger.ts
import fs from 'fs';
import path from 'path';

class Logger {
  private logPath = path.join(__dirname, '../../logs');

  log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(path.join(this.logPath, 'app.log'), logMessage);
  }

  error(message: string, error?: Error) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    if (error) {
      logMessage += `${error.stack}\n`;
    }
    fs.appendFileSync(path.join(this.logPath, 'error.log'), logMessage);
  }
}

export default new Logger();
```

### PM2 Logging

```bash
# View logs
pm2 logs chat-server

# Clear logs
pm2 flush

# Log rotation
pm2 install pm2-logrotate
```

### Nginx Access Logs

```bash
# View access logs
tail -f /var/log/nginx/chat-system-access.log

# Analyze with tools
cat /var/log/nginx/chat-system-access.log | goaccess -
```

### Health Checks

**Endpoint:** `GET /api/health`

```typescript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: sseManager.getStats()
  });
});
```

### Monitoring Tools

- **PM2 Plus:** Advanced monitoring
- **Datadog:** Infrastructure monitoring
- **New Relic:** APM monitoring
- **Grafana + Prometheus:** Custom dashboards

---

## Troubleshooting

### Port Already in Use

```bash
# Check process
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

### Database Locked

```bash
# Check for journal files
ls -la server/database/

# Remove journal files
rm server/database/chat.db-journal
rm server/database/chat.db-wal

# Restart application
pm2 restart chat-server
```

### SSE Connection Issues

**Symptoms:**
- Messages not updating
- Connection keeps dropping

**Solutions:**
```nginx
# Ensure SSE proxy configuration
location /api/sse {
    proxy_buffering off;
    proxy_set_header Connection '';
    proxy_read_timeout 3600s;
}
```

```bash
# Check Nginx error logs
tail -f /var/log/nginx/chat-system-error.log

# Check backend logs
pm2 logs chat-server
```

### File Upload Failures

**Check:**
1. Directory permissions:
   ```bash
   ls -la server/uploads/
   chmod 775 server/uploads/
   ```

2. Nginx configuration:
   ```nginx
   client_max_body_size 10M;
   ```

3. Backend configuration:
   ```env
   MAX_FILE_SIZE=10485760
   ```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart chat-server

# Adjust PM2 limits
max_memory_restart: '500M'
```

### Slow Performance

**Optimizations:**
1. Enable Nginx caching
2. Use CDN for static assets
3. Optimize database queries
4. Enable gzip compression
5. Use Redis for caching (if needed)

---

## Backup Strategy

### Database Backup

**Automated Backup Script:**

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/www/chat-system/server/database/chat.db"
BACKUP_DIR="/var/backups/chat-system"

mkdir -p $BACKUP_DIR

# Backup database
sqlite3 $DB_PATH ".backup $BACKUP_DIR/chat-$DATE.db"

# Keep only last 7 days
find $BACKUP_DIR -name "chat-*.db" -mtime +7 -delete

echo "Backup completed: chat-$DATE.db"
```

**Cron Job:**
```bash
# Edit crontab
crontab -e

# Add backup (daily at 3 AM)
0 3 * * * /path/to/backup-db.sh
```

### Application Backup

```bash
# Backup entire application
tar -czf chat-system-$(date +%Y%m%d).tar.gz /var/www/chat-system

# Upload to cloud storage
aws s3 cp chat-system-$(date +%Y%m%d).tar.gz s3://backups/
```

---

## Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] Firewall configured (only open necessary ports)
- [ ] SSH key authentication (no password login)
- [ ] Regular security updates
- [ ] File upload validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Rate limiting implemented
- [ ] Database access restricted
- [ ] Regular backups configured
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Error handling doesn't expose sensitive data

---

## Performance Tuning

### Backend

```typescript
// Enable compression
import compression from 'compression';
app.use(compression());

// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP
});
app.use('/api/', limiter);

// Connection pooling (if using PostgreSQL/MySQL)
```

### Frontend

```typescript
// Code splitting
const ChatContainer = lazy(() => import('./ChatContainer'));

// Image optimization
import Image from 'next/image'; // or use proper image optimization

// Bundle analysis
bun run build --analyze
```

### Nginx

```nginx
# Worker processes
worker_processes auto;

# Connections
worker_connections 2048;

# Keep alive
keepalive_timeout 65;
```

---

## Update and Maintenance

### Update Application

```bash
# SSH into server
ssh user@server

# Navigate to application
cd /var/www/chat-system

# Pull latest changes
git pull origin main

# Install dependencies
bun install

# Rebuild
bun run build

# Restart services
pm2 restart chat-server

# Check status
pm2 status
```

### Database Migration

```bash
cd server

# Run new migration
bun run db:migrate

# Restart server
pm2 restart chat-server
```

---

## Rollback Procedure

### Quick Rollback

```bash
# Revert to previous commit
git revert HEAD

# Restore from backup
cp /var/backups/chat-system/chat-20240101.db /var/www/chat-system/server/database/chat.db

# Restart services
pm2 restart chat-server
```

### Full Rollback

```bash
# Restore previous backup
tar -xzf chat-system-20240101.tar.gz -C /

# Restart all services
pm2 restart all
sudo systemctl reload nginx
```

---

## Scaling Strategies

### Horizontal Scaling

1. **Load Balancer:**
   - Use Nginx as load balancer
   - Configure multiple backend instances

2. **Database:**
   - Migrate to PostgreSQL/MySQL for better performance
   - Use read replicas for scaling reads

3. **Session Management:**
   - Use Redis for session storage
   - Share SSE connections across instances

### Vertical Scaling

1. **Upgrade Server:**
   - More CPU cores
   - More RAM
   - Faster storage (SSD)

2. **Optimize:**
   - Enable compression
   - Optimize database queries
   - Cache frequently accessed data

---

## Cost Optimization

1. **Right-size instances:** Don't over-provision
2. **Use CDN:** Reduce bandwidth costs
3. **Auto-scaling:** Scale up/down as needed
4. **Reserved instances:** Save money on consistent usage
5. **Optimize images:** Reduce storage and bandwidth

---

## Compliance and Legal

### GDPR Compliance

- Implement data export
- Provide data deletion
- Cookie consent
- Privacy policy

### Data Retention

- Set retention policies
- Automated cleanup jobs
- Audit logs

---

## Support and Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Monitor performance
- Verify backups

**Weekly:**
- Review security logs
- Check disk space
- Test backup restoration

**Monthly:**
- Update dependencies
- Review and optimize database
- Security audit

### Emergency Contact

- Administrator: [email]
- Support: [email]
- Monitoring: [dashboard URL]
