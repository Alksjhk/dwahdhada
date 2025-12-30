# Web Chat System - Quick Reference

This document provides quick navigation links to all skill documentation.

## Core Documentation

| Document | Description | When to Use |
|----------|-------------|--------------|
| **[SKILL.md](./SKILL.md)** | Main skill documentation with complete project overview | First-time setup, understanding architecture |
| **[README.md](./README.md)** | Skill overview and usage guide | Getting started with this skill |

## Reference Documentation

### API & Backend

| Document | Description |
|----------|-------------|
| **[API Endpoints](./references/api-endpoints.md)** | Complete API reference with examples | Implementing new API endpoints, debugging API issues |
| **[Database Schema](./references/database-schema.md)** | Database structure, queries, optimization | Database operations, migrations, performance tuning |

### Frontend

| Document | Description |
|----------|-------------|
| **[Component Reference](./references/component-reference.md)** | React components, hooks, styling | Building/modifying frontend components |

### Deployment

| Document | Description |
|----------|-------------|
| **[Deployment Guide](./references/deployment-guide.md)** | Complete deployment instructions | Deploying to production, server configuration |

## Automation Scripts

| Script | Description | Usage |
|--------|-------------|--------|
| **[setup-dev-env.js](./scripts/setup-dev-env.js)** | One-click environment setup | Initial project setup |
| **[backup-database.sh](./scripts/backup-database.sh)** | Automated database backups | Daily backups, disaster recovery |
| **[restore-database.sh](./scripts/restore-database.sh)** | Database restore utility | Disaster recovery, testing |

## Configuration Templates

| File | Description |
|------|-------------|
| **[ecosystem.config.example.js](./assets/ecosystem.config.example.js)** | PM2 process management configuration |
| **[nginx.conf.example](./assets/nginx.conf.example)** | Nginx reverse proxy configuration |
| **[docker-compose.example.yml](./assets/docker-compose.example.yml)** | Docker deployment configuration |

## Quick Links by Topic

### Architecture
- **Project Structure**: See [SKILL.md - Project Structure](./SKILL.md#project-structure)
- **Component Hierarchy**: See [Component Reference](./references/component-reference.md#component-architecture)
- **Database Design**: See [Database Schema](./references/database-schema.md)

### Development
- **Setup**: Run `node scripts/setup-dev-env.js`
- **Dependencies**: `bun run install:all`
- **Start**: `bun run dev`

### API Development
- **Endpoints**: [API Endpoints Reference](./references/api-endpoints.md)
- **Routes**: See [SKILL.md - API Reference](./SKILL.md#api-reference)
- **SSE Implementation**: See [Technical.md](../../Technical.md#sse-implementation)

### Frontend Development
- **Components**: [Component Reference](./references/component-reference.md)
- **State Management**: [SKILL.md - State Management](./SKILL.md#state-management)
- **SSE Manager**: [Component Reference - SSE Manager](./references/component-reference.md#sse-manager)

### Database
- **Schema**: [Database Schema Reference](./references/database-schema.md)
- **Queries**: [Database Schema - Query Examples](./references/database-schema.md#query-examples)
- **Migrations**: [Database Schema - Migration Guide](./references/database-schema.md#migration-guide)

### Deployment
- **Complete Guide**: [Deployment Guide](./references/deployment-guide.md)
- **Nginx Config**: [nginx.conf.example](./assets/nginx.conf.example)
- **PM2 Config**: [ecosystem.config.example.js](./assets/ecosystem.config.example.js)
- **Docker**: [docker-compose.example.yml](./assets/docker-compose.example.yml)

### Operations
- **Backup**: `./scripts/backup-database.sh`
- **Restore**: `./scripts/restore-database.sh <backup-file>`
- **Monitoring**: [Deployment Guide - Monitoring](./references/deployment-guide.md#monitoring-and-logging)

### Troubleshooting
- **Common Issues**: [SKILL.md - Troubleshooting](./SKILL.md#troubleshooting)
- **Deployment Issues**: [Deployment Guide - Troubleshooting](./references/deployment-guide.md#troubleshooting)
- **Database Issues**: [Database Schema - Security](./references/database-schema.md#security-considerations)

## Feature Implementation Guides

### Adding a New API Endpoint
1. Review [API Endpoints](./references/api-endpoints.md) for patterns
2. Add controller in `server/src/controllers/`
3. Define route in `server/src/routes/`
4. Update API documentation
5. Test with curl or Postman

### Creating a New Component
1. Review [Component Reference](./references/component-reference.md) for patterns
2. Create component file in `client/src/components/`
3. Add CSS module for styling
4. Define TypeScript types if needed
5. Integrate with existing components

### Database Migration
1. Plan changes in [Database Schema](./references/database-schema.md)
2. Create migration script
3. Test on development database
4. Backup production database
5. Run migration on production

### Deploying to Production
1. Follow [Deployment Guide](./references/deployment-guide.md)
2. Use configuration templates in `assets/`
3. Test thoroughly before deployment
4. Monitor logs and performance
5. Have rollback plan ready

## Code Snippets

### API Call Pattern
```typescript
import { messageAPI } from './utils/api';

const response = await messageAPI.sendMessage({
  roomId: 1,
  userId: 'alice123',
  content: 'Hello!'
});
```

### Component Pattern
```typescript
import React, { useState, useEffect } from 'react';
import styles from './ComponentName.module.css';

const Component: React.FC<Props> = ({ prop }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Component logic
  }, [prop]);

  return <div className={styles.container}>{/* content */}</div>;
};
```

### Database Query
```typescript
const messages = await db.all(
  'SELECT * FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT ?',
  [roomId, limit]
);
```

### SSE Connection
```typescript
const sseManager = new SSEManager(
  (messages) => setMessages(prev => [...prev, ...messages]),
  (data) => console.log('Connected:', data),
  (error) => console.error('Error:', error)
);

sseManager.connect(roomId, userId);
```

## Common Workflows

### Starting Development
```bash
# 1. Setup environment
node .codebuddy/skills/web-chat-system/scripts/setup-dev-env.js

# 2. Install dependencies
bun run install:all

# 3. Initialize database
cd server && bun run db:init

# 4. Start development servers
bun run dev
```

### Database Operations
```bash
# Backup
./scripts/backup-database.sh ./backups

# Restore
./scripts/restore-database.sh backups/chat-20240101_120000.db

# Manual query
sqlite3 server/database/chat.db
```

### Production Deployment
```bash
# 1. Build
bun run build

# 2. Test production build locally
bun start

# 3. Deploy to server
# (Copy files or use git pull)

# 4. Setup PM2
pm2 start ecosystem.config.js

# 5. Configure Nginx
# (Copy nginx.conf.example to /etc/nginx/sites-available/)
sudo systemctl reload nginx
```

## Environment Variables

### Server (.env)
```env
PORT=3001
DATABASE_PATH=./database/chat.db
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://localhost:5173
```

### Client (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Project File Locations

### Frontend
- Components: `client/src/components/`
- Utils: `client/src/utils/`
- Context: `client/src/context/`
- Hooks: `client/src/hooks/`
- Types: `client/src/types.ts`

### Backend
- Controllers: `server/src/controllers/`
- Routes: `server/src/routes/`
- Utils: `server/src/utils/`
- Database: `server/src/database/`
- DB File: `server/database/chat.db`

### Configuration
- Environment: `server/.env`, `client/.env`
- PM2: `ecosystem.config.js`
- Nginx: `/etc/nginx/sites-available/chat-system`

## Port Configuration

| Service | Default Port | Description |
|----------|---------------|-------------|
| Frontend Dev | 5173 | Vite dev server |
| Backend Dev | 3001 | Express server |
| Backend Prod | 3001 | Express server |
| Nginx HTTP | 80 | HTTP traffic |
| Nginx HTTPS | 443 | HTTPS traffic |

## Health Checks

### API Health
```bash
curl http://localhost:3001/api/health
```

### SSE Connection
```bash
curl -N http://localhost:3001/api/sse/0?userId=test
```

### Database Connection
```bash
sqlite3 server/database/chat.db "SELECT 1;"
```

## Useful Commands

```bash
# Development
bun run dev              # Start both services
bun run server:dev       # Backend only
bun run client:dev       # Frontend only

# Build
bun run build           # Build both
bun run server:build    # Backend build
bun run client:build    # Frontend build

# Database
bun run db:init         # Initialize database
bun run db:migrate      # Run migrations

# Production
bun start              # Start production servers
pm2 status             # Check PM2 status
pm2 logs chat-server   # View logs
pm2 restart chat-server # Restart server

# Nginx
sudo nginx -t          # Test configuration
sudo systemctl reload nginx  # Reload Nginx
```

## Related Project Documentation

- [README.md](../../README.md) - Project overview
- [Structure.md](../../Structure.md) - Detailed file structure
- [Technical.md](../../Technical.md) - Complete technical documentation
- [Deployment.md](../../Deployment.md) - Deployment instructions

## Support Resources

### External Documentation
- React: https://react.dev
- Express: https://expressjs.com
- SQLite: https://www.sqlite.org/docs.html
- SSE: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- Nginx: https://nginx.org/en/docs/
- PM2: https://pm2.keymetrics.io/

### Troubleshooting
- Check logs: `pm2 logs chat-server`
- Check Nginx: `tail -f /var/log/nginx/chat-system-error.log`
- Database issues: Review [Database Schema](./references/database-schema.md)
- Deployment issues: Review [Deployment Guide](./references/deployment-guide.md)

---

**Last Updated:** 2024-12-29
**Skill Version:** 1.0.0
