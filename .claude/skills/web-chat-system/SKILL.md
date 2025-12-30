---
name: web-chat-system
description: This skill provides comprehensive guidance for the Web Chat System project, a lightweight real-time chat application built with React + Node.js + SQLite. Use this skill when working with any aspect of the chat system development, maintenance, debugging, or deployment. It includes project architecture, API specifications, database schema, SSE implementation details, component structure, and development workflows.
---

# Web Chat System Development Skill

This skill provides comprehensive guidance for developing, maintaining, and deploying the Web Chat System - a lightweight real-time chat application.

## Project Overview

The Web Chat System is a full-stack chat application built with:

- **Frontend**: React 18 + TypeScript + Vite + Server-Sent Events (SSE)
- **Backend**: Node.js + Express + SQLite3 + TypeScript + SSE
- **Package Manager**: Bun 1.0+
- **Database**: SQLite3
- **Real-time Communication**: Server-Sent Events (SSE)

**Key Features**:
- No registration required (custom user ID)
- Public lobby and private rooms (6-digit codes)
- Real-time message delivery via SSE
- File upload support (images, documents, max 10MB)
- Responsive design for desktop and mobile
- Message persistence in SQLite

## When to Use This Skill

Use this skill when:
- Understanding project architecture and file structure
- Implementing new features in the chat system
- Debugging SSE connection issues
- Modifying database schema or queries
- Adding new API endpoints
- Updating React components
- Configuring deployment environments
- Troubleshooting connection or message delivery issues
- Reviewing code patterns and best practices

## Project Structure

### Core Directories

```
web-chat-system/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── ChatContainer.tsx     # Main chat UI container
│   │   │   ├── MessageList.tsx      # Message display
│   │   │   ├── MessageInput.tsx     # Input field
│   │   │   ├── RoomSelector.tsx     # Room switching
│   │   │   ├── LoginForm.tsx        # User authentication
│   │   │   ├── ConnectionStatus.tsx  # SSE connection indicator
│   │   │   └── ui/               # Reusable UI components
│   │   ├── context/                 # React Context providers
│   │   │   └── ChatContext.tsx     # Global chat state
│   │   ├── hooks/                   # Custom React hooks
│   │   │   └── useResponsive.ts    # Responsive design hook
│   │   ├── utils/                   # Utility functions
│   │   │   ├── SSEManager.ts       # Client-side SSE management
│   │   │   ├── MessagePoller.ts    # Fallback polling mechanism
│   │   │   └── api.ts            # API client with Axios
│   │   ├── config/                  # Configuration files
│   │   │   └── api.ts            # API configuration
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── App.tsx                 # Root component
│   │   └── main.tsx               # Application entry point
│   └── package.json
│
├── server/                          # Backend Express application
│   ├── src/
│   │   ├── controllers/             # Request handlers
│   │   │   ├── roomController.ts   # Room management
│   │   │   ├── messageController.ts # Message handling
│   │   │   ├── fileController.ts   # File upload/download
│   │   │   └── sseController.ts    # SSE endpoint handling
│   │   ├── routes/                 # Express routes
│   │   │   ├── roomRoutes.ts      # Room endpoints
│   │   │   ├── messageRoutes.ts   # Message endpoints
│   │   │   ├── fileRoutes.ts      # File endpoints
│   │   │   └── sseRoutes.ts      # SSE endpoints
│   │   ├── database/               # Database initialization
│   │   │   ├── init.ts           # Database setup
│   │   │   └── migrate.ts        # Schema migrations
│   │   ├── utils/                  # Backend utilities
│   │   │   ├── database.ts        # Database connection
│   │   │   └── SSEManager.ts     # Server-side SSE management
│   │   ├── app.ts                  # Express app setup
│   │   └── types.ts               # Backend type definitions
│   ├── database/
│   │   └── chat.db                # SQLite database file
│   ├── uploads/                    # File upload directory
│   └── package.json
│
└── Documentation Files
    ├── README.md                   # Project overview and quick start
    ├── Structure.md               # Detailed file structure
    ├── Technical.md               # Complete technical documentation
    └── Deployment.md             # Deployment instructions
```

## Architecture Patterns

### Frontend Architecture

**Component Hierarchy**:
```
App (Root)
├── LoginForm (Initial authentication)
└── ChatContext.Provider
    └── ChatContainer
        ├── ChatHeader (Room info + Status)
        ├── RoomSelector (Public/Private switching)
        ├── MessageList (Scrollable messages)
        │   └── MessageBubble (Individual messages)
        ├── MessageInput (Text + File upload)
        └── ConnectionStatus (SSE indicator)
```

**State Management**:
- React Context (`ChatContext`) for global state
- Local component state for UI-specific data
- SSEManager handles connection state separately

**Real-time Communication**:
- Primary: Server-Sent Events (SSE) via `SSEManager`
- Automatic reconnection with exponential backoff (max 5 attempts)
- Event types: `connected`, `newMessage`, `userStatus`, `error`
- Connection state management via `ConnectionStatus` component

### Backend Architecture

**Request Flow**:
```
Client Request
    ↓
Express Router (routes/)
    ↓
Controller (controllers/)
    ↓
Business Logic
    ↓
Database (utils/database.ts)
    ↓
Response + SSE Broadcast (utils/SSEManager.ts)
```

**SSE Implementation**:
- Singleton `SSEManager` manages all SSE connections
- Room-based subscription model with Map storage
- Automatic cleanup on disconnect via `close` event
- Event broadcasting to all room subscribers
- Connection statistics via `/api/sse/stats`

## Database Schema

### Tables

**users**: User information
- `id` (INTEGER, PK, AUTOINCREMENT)
- `user_id` (TEXT, UNIQUE) - Custom user ID
- `created_at` (DATETIME) - Registration time

**rooms**: Chat rooms
- `id` (INTEGER, PK, AUTOINCREMENT)
- `room_code` (CHAR(6), UNIQUE) - 6-digit room number
- `room_name` (TEXT) - Room display name
- `created_by` (TEXT) - Creator user ID
- `admin_users` (TEXT) - JSON array of admin IDs
- `created_at` (DATETIME) - Creation time
- `is_public` (BOOLEAN) - 0=private, 1=public lobby

> Special case: Public lobby has `id=0`, `room_code='PUBLIC'`, `is_public=1`

**user_status**: User online status
- `id` (INTEGER, PK, AUTOINCREMENT)
- `user_id` (TEXT, UNIQUE) - User identifier
- `room_id` (INTEGER, FK) - Current room
- `is_online` (BOOLEAN) - Online status
- `last_seen` (DATETIME) - Last activity

**messages**: Chat messages
- `id` (INTEGER, PK, AUTOINCREMENT) - Used for incremental polling
- `room_id` (INTEGER, FK) - Room identifier
- `user_id` (TEXT) - Sender
- `content` (TEXT) - Message content
- `message_type` (TEXT) - 'text', 'image', or 'file'
- `file_name` (TEXT) - Original filename
- `file_size` (INTEGER) - File size in bytes
- `file_url` (TEXT) - Download URL
- `created_at` (DATETIME) - Timestamp

**Indexes**:
- `idx_users_user_id` ON users(user_id)
- `idx_messages_room_id` ON messages(room_id)
- `idx_messages_created_at` ON messages(created_at)

## API Reference

### Room Management

**GET** `/api/rooms/public`
- Returns: `{ success: true, roomId: 0, roomName: "公共大厅" }`

**POST** `/api/rooms/create`
- Body: `{ roomCode: "123456", userId: "user123" }`
- Returns: `{ success: true, roomId: 1, roomName: "私密房间" }`
- Errors: "房间号必须是6位数字", "房间已存在"

**GET** `/api/rooms/join/:roomCode`
- Returns: `{ success: true, roomId: 1, roomName: "私密房间" }`
- Errors: "房间不存在"

### Message Management

**POST** `/api/messages/send`
- Body: `{ roomId: 1, userId: "user123", content: "Hello" }`
- Validation: 1-500 characters
- Returns: `{ success: true, messageId: 101 }`

**GET** `/api/messages/:roomId/latest?limit=50`
- Returns: `{ success: true, messages: [...] }`
- Initial load for message history

**GET** `/api/messages/:roomId?lastMessageId=100`
- Returns: `{ success: true, hasNew: true/false, messages: [...] }`
- Polling endpoint (fallback, not used in current implementation)

**GET** `/api/sse/:roomId?userId=user123`
- Response: Server-Sent Events stream
- Events: `connected`, `newMessage`, `userStatus`, `error`
- **Key endpoint**: Handles all real-time message delivery

**GET** `/api/sse/stats`
- Returns: `{ success: true, data: { "0": 5, "1": 3 } }`
- Room subscriber counts for monitoring

### File Management

**POST** `/api/files/upload`
- Form: `multipart/form-data` with `file` field
- Max size: 10MB
- Returns: `{ success: true, fileUrl: "/uploads/...", fileName: "...", fileSize: 102400 }`

**GET** `/api/files/:filename`
- Returns: File binary data

## Development Workflow

### Initial Setup

```bash
# Install dependencies
bun run install:all

# Configure environment
cp client/.env.example client/.env
cp server/.env.example server/.env

# Start development servers
bun run dev
```

### Adding New Features

1. **Frontend Components**:
   - Create component in `client/src/components/`
   - Add styles as `ComponentName.module.css`
   - Define types in `client/src/types.ts`
   - Integrate via `ChatContext` or props

2. **API Endpoints**:
   - Add controller method in `server/src/controllers/`
   - Define route in `server/src/routes/`
   - Register route in `server/src/app.ts`
   - Add API client method in `client/src/utils/api.ts`

3. **Database Changes**:
   - Create migration script in `server/src/database/migrate.ts`
   - Update schema in `server/src/database/init.ts`
   - Test with development database
   - Document migration in Technical.md

### Testing

**Frontend**:
```bash
cd client
bun run dev          # Development server (port 5173)
bun run build        # Production build
```

**Backend**:
```bash
cd server
bun run dev          # Development server (port 3001)
bun run build        # TypeScript compilation
bun start            # Production server
```

### Debugging

**SSE Connection Issues**:
1. Check `ConnectionStatus` component for connection state
2. Verify SSE endpoint at `/api/sse/:roomId`
3. Check browser console for connection errors
4. Ensure CORS is configured correctly
5. Test SSE route with curl: `curl -N "http://localhost:3001/api/sse/0?userId=test"`

**Message Delivery Issues**:
1. Verify message sent to backend
2. Check database for inserted record
3. Confirm SSE broadcast in backend logs
4. Verify client SSE event handler
5. Check `SSEManager.isConnected()` status

**Database Issues**:
1. Check SQLite file permissions
2. Verify table schemas with SQLite browser
3. Run migration scripts
4. Check database logs in console

## Deployment

### Development Deployment

```bash
# Start both frontend and backend
bun run dev

# Individual services
bun run server:dev    # Port 3001
bun run client:dev    # Port 5173
```

### Production Deployment

**Backend**:
```bash
cd server
bun install
bun run build        # Compile TypeScript
pm2 start dist/app.js --name chat-server
```

**Frontend**:
```bash
cd client
bun install
bun run build       # Build to dist/
# Deploy dist/ to web server
```

**Nginx Configuration** (see Deployment.md for complete setup):
- Proxy `/api/` to backend port 3001
- Serve frontend static files
- **Critical**: Disable buffering for SSE routes:
  ```nginx
  proxy_buffering off;
  proxy_set_header Connection '';
  proxy_set_header Cache-Control no-cache;
  proxy_set_header X-Accel-Buffering no;
  ```
- Set `client_max_body_size 10M` for file uploads

### Environment Variables

**Server** (`server/.env`):
```env
PORT=3001
DATABASE_PATH=./database/chat.db
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

**Client** (`client/.env`):
```env
VITE_API_BASE_URL=/api
```

## Common Tasks

### Adding a New Message Type

1. Update `message_type` enum in database
2. Add message type validation in `messageController.ts`
3. Update `Message` type in `client/src/types.ts`
4. Add rendering logic in `MessageBubble.tsx`
5. Update API documentation

### Customizing Room Behavior

1. Modify `roomController.ts` for validation
2. Update room creation logic
3. Adjust room switching in `RoomSelector.tsx`
4. Test with various room codes

### Implementing Rate Limiting

1. Install `express-rate-limit` package
2. Create middleware in `server/src/`
3. Apply to routes in `app.ts`
4. Configure window and max requests

### Adding User Profiles

1. Extend `users` table with profile fields
2. Create migration script
3. Add profile API endpoints
4. Update frontend to display profiles
5. Integrate with existing user context

## Troubleshooting

**Port Already in Use**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :3001
kill -9 <PID>
```

**File Upload Failures**:
- Verify `uploads/` directory exists
- Check directory permissions (755)
- Ensure MAX_FILE_SIZE matches Nginx config
- Verify multipart/form-data encoding

**Database Lock Errors**:
- Close all database connections
- Delete SQLite lock files (*.db-journal)
- Restart server
- Consider connection pooling

**SSE Disconnects**:
- Check for proxy configuration issues (Nginx buffering settings)
- Verify keep-alive settings
- Monitor server logs for errors
- Test with direct connection: `curl -N "http://localhost:3001/api/sse/0?userId=test"`
- Check browser network tab for SSE connection status

**Real-time Messages Not Received**:
- Verify `SSEManager.connect()` was called
- Check `ConnectionStatus` component shows "已连接"
- Confirm message was saved to database
- Check backend logs for SSE broadcast
- Verify user is in correct room subscription

## Best Practices

### Code Style

- Use TypeScript strict mode
- Follow functional programming patterns
- Prefer React hooks over class components
- Use CSS Modules for component styling
- Keep API calls in separate utility functions
- Implement proper error handling
- Add console logs for debugging (remove in production)

### Security

- Validate all user inputs
- Sanitize message content
- Implement file type validation
- Set reasonable rate limits
- Use environment variables for secrets
- Enable CORS for frontend domain only
- Regularly update dependencies

### Performance

- Use database indexes on query fields
- Implement message pagination
- Cache static assets
- Optimize bundle size
- Lazy load components when possible
- **Clean up SSE connections on unmount** (critical for memory management)
- Monitor SSE connection count via `/api/sse/stats`
- Batch message processing when possible

## Reference Documentation

For detailed information on:
- **Complete API specification**: See `Technical.md` Section 4
- **Database schema details**: See `Technical.md` Section 3
- **SSE implementation**: See `Technical.md` Section 7
- **Component patterns**: See `Technical.md` Section 8
- **Deployment guides**: See `Deployment.md`
- **Project structure**: See `Structure.md`
- **Quick start guide**: See `README.md`

## Scripts and Automation

Use bundled scripts in `scripts/` for:
- Database initialization
- Backup procedures
- Migration execution
- Development server management

## TypeScript Types

Key type definitions are centralized in:
- Frontend: `client/src/types.ts`
- Backend: `server/src/types.ts`

When modifying types, ensure consistency across frontend and backend.

## State Management

**ChatContext** provides:
- `currentUser`: Current user ID
- `currentRoom`: Current room object
- `messages`: Array of messages
- `isLoading`: Loading state
- `isConnected`: Connection status
- Dispatch methods for updating state

Use context for global state; use local state for component-specific data.

## SSE Connection Lifecycle

1. **Connect**: `SSEManager.connect(roomId, userId)` → `GET /api/sse/:roomId?userId=:userId`
2. **Connected**: Receive `connected` event → Update `ConnectionStatus` to "已连接"
3. **Receive Messages**: `newMessage` events pushed in real-time → Auto-update UI
4. **Room Switch**: `SSEManager.updateRoomId(newRoomId)` → Old connection closed, new one established
5. **Disconnect**: Browser closes or component unmounts → `destroy()` called
6. **Reconnect**: Automatic with exponential backoff (max 5 attempts) → On `onerror` event

**Connection States**:
- `未连接` - Initial state
- `连接中` - Connecting to SSE
- `已连接` - Active SSE connection
- `连接错误` - Connection failed
- `连接失败` - Network error

## File Upload Flow

1. User selects file in `MessageInput`
2. Frontend validates size and type
3. POST to `/api/files/upload` with FormData
4. Server saves file to `uploads/` directory
5. Returns file URL
6. Frontend creates message with file URL
7. Message broadcast via SSE

## Error Handling

**Frontend Errors**:
- Display user-friendly messages
- Log to console in development
- Report to error monitoring in production
- Show connection status indicator

**Backend Errors**:
- Return structured error responses
- Log error details
- Handle database errors gracefully
- Clean up resources on error

## Performance Monitoring

Key metrics to monitor:
- SSE connection count per room
- Message delivery latency
- Database query times
- API response times
- File upload/download success rate

Use `GET /api/sse/stats` to monitor SSE connections in real-time.
