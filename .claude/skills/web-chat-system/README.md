# Web Chat System Skill

A comprehensive development skill for the Web Chat System - a lightweight real-time chat application built with React + Node.js + SQLite.

## Overview

This skill provides complete guidance for developing, maintaining, and deploying the Web Chat System. It includes project architecture, API specifications, database schema, component documentation, deployment guides, and automation scripts.

## Skill Structure

```
web-chat-system/
├── SKILL.md                           # Main skill documentation
├── README.md                          # This file
├── references/                         # Reference documentation
│   ├── api-endpoints.md               # Complete API reference
│   ├── database-schema.md             # Database schema and queries
│   ├── component-reference.md          # React component documentation
│   └── deployment-guide.md          # Deployment instructions
├── scripts/                           # Automation scripts
│   ├── backup-database.sh             # Database backup script
│   ├── restore-database.sh            # Database restore script
│   └── setup-dev-env.js             # Development environment setup
└── assets/                           # Configuration templates
```

## Quick Start

### For AI Assistants

When a user asks about:
- **Project architecture**: Refer to SKILL.md
- **API endpoints**: Check `references/api-endpoints.md`
- **Database queries**: See `references/database-schema.md`
- **React components**: Review `references/component-reference.md`
- **Deployment**: Follow `references/deployment-guide.md`
- **Environment setup**: Use `scripts/setup-dev-env.js`

### For Developers

1. **Initial Setup**:
   ```bash
   node .codebuddy/skills/web-chat-system/scripts/setup-dev-env.js
   ```

2. **Install Dependencies**:
   ```bash
   bun run install:all
   ```

3. **Start Development**:
   ```bash
   bun run dev
   ```

## Key Features

### Frontend
- React 18 with TypeScript
- Server-Sent Events (SSE) for real-time updates
- Responsive design with CSS Modules
- File upload support
- Public and private rooms

### Backend
- Express.js with TypeScript
- SQLite3 database
- SSE for real-time communication
- File upload handling
- Room management system

### Real-time Communication
- Server-Sent Events (SSE) for message delivery
- Automatic reconnection with exponential backoff
- Room-based subscriptions
- User status broadcasting

## Documentation Sections

### SKILL.md
Main skill documentation covering:
- Project overview and architecture
- File structure
- Component hierarchy
- API reference summary
- Database schema overview
- Development workflow
- Deployment procedures
- Common tasks
- Troubleshooting guide
- Best practices

### references/api-endpoints.md
Complete API documentation:
- Room management endpoints
- Message management endpoints
- Server-Sent Events endpoints
- File management endpoints
- Request/response examples
- Error handling
- Rate limiting guidelines

### references/database-schema.md
Database reference:
- Table structures
- Field descriptions
- Indexes
- Query examples
- Migration guide
- Performance optimization
- Backup and restore
- Security considerations

### references/component-reference.md
React component documentation:
- Component hierarchy
- Props and state
- Usage examples
- Styling patterns
- Custom hooks
- Context providers
- Utility functions

### references/deployment-guide.md
Deployment instructions:
- Environment requirements
- Development deployment
- Production deployment
- Nginx configuration
- PM2 process management
- Docker deployment
- Cloud deployment (AWS, DigitalOcean, Heroku)
- SSL/HTTPS setup
- Monitoring and logging
- Backup strategies

## Scripts

### backup-database.sh
Automated database backup:
```bash
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh [backup_dir]
```

Features:
- Creates SQLite backup
- Validates backup integrity
- Cleans up old backups (7-day retention)
- Logs backup information

### restore-database.sh
Database restore utility:
```bash
chmod +x scripts/restore-database.sh
./scripts/restore-database.sh <backup_file>
```

Features:
- Validates backup file
- Backs up current database
- Restores from backup
- Provides database statistics
- Optional server restart

### setup-dev-env.js
Development environment setup:
```bash
node scripts/setup-dev-env.js
```

Features:
- Creates directory structure
- Generates environment files
- Creates PM2 configuration
- Generates Nginx template
- Creates deployment checklist
- Creates development guide

## Common Use Cases

### Adding a New Feature

1. Review architecture in SKILL.md
2. Check database schema in database-schema.md
3. Update API endpoints (reference api-endpoints.md)
4. Modify/create components (reference component-reference.md)
5. Test locally
6. Update documentation

### Debugging Issues

1. Check deployment guide for common issues
2. Review logs and monitoring section
3. Check database queries
4. Verify API responses
5. Test SSE connections

### Deploying to Production

1. Follow deployment-guide.md
2. Use setup-dev-env.js to generate configs
3. Set up Nginx with provided template
4. Configure PM2 ecosystem
5. Test deployment
6. Set up monitoring

### Database Operations

```bash
# Backup
./scripts/backup-database.sh

# Restore
./scripts/restore-database.sh backups/chat-20240101.db

# Manual queries
sqlite3 server/database/chat.db
```

### API Testing

```bash
# Get public room
curl http://localhost:3001/api/rooms/public

# Send message
curl -X POST http://localhost:3001/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"roomId":1,"userId":"test","content":"Hello"}'

# Test SSE
curl -N http://localhost:3001/api/sse/0?userId=test
```

## Project Architecture

### Frontend Components
```
App
├── LoginForm
└── ChatContainer
    ├── ChatHeader
    ├── RoomSelector
    ├── MessageList
    │   └── MessageBubble
    ├── MessageInput
    └── ConnectionStatus
```

### Backend Structure
```
server/src/
├── controllers/    # Request handlers
├── routes/        # API routes
├── database/      # DB initialization
└── utils/         # Utilities (SSE, database)
```

### Database Tables
- `users` - User information
- `rooms` - Chat rooms
- `user_status` - Online status
- `messages` - Chat messages

## Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite3 |
| Real-time | Server-Sent Events (SSE) |
| Package Manager | Bun 1.0+ |
| Production | PM2 + Nginx |

## Key Concepts

### Server-Sent Events (SSE)
- Single-directional real-time communication
- Built on standard HTTP
- Automatic reconnection
- Lower resource usage than polling
- Better browser compatibility than WebSocket

### Room System
- Public lobby (id=0, room_code='PUBLIC')
- Private rooms (6-digit codes)
- Room-based message subscriptions
- User can switch between rooms

### Message Types
- Text messages (1-500 characters)
- Image uploads (max 10MB)
- File attachments (max 10MB)

## Development Workflow

1. **Feature Development**
   - Create/update components
   - Add API endpoints
   - Update database schema if needed
   - Write tests
   - Update documentation

2. **Testing**
   - Test locally with bun run dev
   - Verify API endpoints
   - Test SSE connections
   - Test file uploads

3. **Building**
   ```bash
   cd client && bun run build
   cd server && bun run build
   ```

4. **Deployment**
   - Follow deployment guide
   - Backup current version
   - Deploy new version
   - Monitor for issues

## Monitoring

### Application Metrics
- SSE connection count
- Message delivery rate
- API response times
- Error rates
- Database performance

### Logs
- Application logs (PM2)
- Nginx access/error logs
- Database query logs (optional)
- Error tracking (Sentry, etc.)

## Best Practices

### Code Style
- Use TypeScript strict mode
- Follow functional programming patterns
- Use CSS Modules for styling
- Implement proper error handling
- Add comments for complex logic

### Security
- Validate all inputs
- Sanitize user content
- Use environment variables
- Enable CORS correctly
- Implement rate limiting

### Performance
- Use database indexes
- Enable compression
- Optimize bundle size
- Cache static assets
- Clean up SSE connections

## Troubleshooting

### Common Issues

**Port in Use**
```bash
lsof -i :3001  # Find process
kill -9 <PID>    # Kill process
```

**Database Locked**
```bash
rm server/database/chat.db-journal
rm server/database/chat.db-wal
```

**SSE Not Working**
- Check Nginx configuration (proxy_buffering off)
- Verify firewall settings
- Check browser console for errors
- Test with curl

**File Upload Fails**
- Check directory permissions (775)
- Verify MAX_FILE_SIZE setting
- Check Nginx client_max_body_size

## Additional Resources

### Project Documentation
- `README.md` - Project overview
- `Structure.md` - File structure
- `Technical.md` - Complete technical documentation
- `Deployment.md` - Deployment instructions

### External Documentation
- React Documentation: https://react.dev
- Express Documentation: https://expressjs.com
- SQLite Documentation: https://www.sqlite.org/docs.html
- SSE MDN: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

## Contributing

When updating the skill:
1. Keep SKILL.md concise and focused on workflows
2. Add detailed information to references/
3. Update scripts to match changes
4. Test scripts before committing
5. Document new features

## License

This skill follows the same license as the Web Chat System project.

## Support

For issues or questions:
1. Check SKILL.md for common tasks
2. Review relevant reference documents
3. Check deployment guide for common issues
4. Review project documentation in main repo

---

**Version:** 1.0.0
**Last Updated:** 2024-12-29
**Maintainer:** Web Chat System Development Team
