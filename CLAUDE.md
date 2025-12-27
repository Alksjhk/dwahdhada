# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lightweight real-time chat system built with React (frontend) and Node.js/Express (backend), using SQLite for persistence. The system supports public chat rooms and private 6-digit room codes, with file/image sharing and message recall functionality.

## Common Commands

### Development
```bash
# Start both frontend and backend concurrently
npm run dev

# Backend only (port 3001)
cd server && npm run dev

# Frontend only (port 5173)
cd client && npm run dev
```

### Build & Production
```bash
# Build frontend only
npm run build

# Build backend (compiles TypeScript)
cd server && npm run build

# Start production server
cd server && npm start
```

### Installation
```bash
# Install all dependencies
npm install
cd server && npm install
cd client && npm install
```

## Architecture

### Monorepo Structure
```
├── server/           # Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # Express routes
│   │   ├── database/       # DB init & migrations
│   │   ├── utils/          # Database wrapper
│   │   └── app.ts          # Entry point
│   └── database/           # SQLite DB files
├── client/           # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # State management
│   │   ├── utils/          # API & polling
│   │   ├── hooks/          # Custom hooks
│   │   └── types.ts        # TypeScript types
```

### Key Design Patterns

**Backend:**
- **Express Router Pattern**: Separate route files for rooms, messages, files
- **Controller Pattern**: Business logic in controller classes
- **Database Wrapper**: Promise-based SQLite wrapper in `server/src/utils/database.ts`
- **Migration System**: Automatic schema migrations in `server/src/database/migrate.ts`

**Frontend:**
- **Context + Reducer**: Global state management via `ChatContext.tsx`
- **HTTP Polling**: 1-second interval polling via `MessagePoller` class
- **Component Composition**: Small, focused components
- **Responsive Hook**: `useResponsive` for mobile/desktop detection

### Data Flow

1. **User Login**: Stores user ID in localStorage, sets context state
2. **Room Selection**:
   - Public room: ID=0, hardcoded
   - Private room: 6-digit code, creates or joins via API
3. **Message Polling**:
   - Initial load: `GET /api/messages/:roomId/latest`
   - Polling: `GET /api/messages/:roomId?lastMessageId=X` every 1 second
4. **Send Message**: `POST /api/messages/send` → triggers immediate poll

## Database Schema

### Tables
- **users**: `id, user_id, created_at`
- **rooms**: `id, room_code, room_name, created_by, admin_users, created_at, is_public`
- **user_status**: `id, user_id, room_id, is_online, last_seen`
- **messages**: `id, room_id, user_id, content, message_type, file_name, file_size, file_url, created_at`

### Special Values
- Public room has `room_code = 'PUBLIC'` and `id = 0` (hardcoded in API)
- Room codes are 6-digit strings in private rooms

## API Endpoints

### Room Management
- `GET /api/rooms/public` - Get public room info
- `POST /api/rooms/create` - Create private room
- `GET /api/rooms/join/:roomCode` - Join existing room

### Message Management
- `POST /api/messages/send` - Send message (text/image/file)
- `GET /api/messages/:roomId` - Poll for new messages
- `GET /api/messages/:roomId/latest` - Get recent messages

### File Management
- `POST /api/files/upload` - Upload file
- `GET /api/files/:filename` - Download file

## Key Files to Understand

### Backend
- `server/src/app.ts` - Express setup, middleware, routes
- `server/src/utils/database.ts` - Promise-based SQLite wrapper
- `server/src/database/init.ts` - Table creation & seeding
- `server/src/database/migrate.ts` - Schema migrations
- `server/src/controllers/messageController.ts` - Message CRUD logic

### Frontend
- `client/src/context/ChatContext.tsx` - State management (Context + Reducer)
- `client/src/utils/MessagePoller.ts` - HTTP polling implementation
- `client/src/utils/api.ts` - Axios API client
- `client/src/components/ChatContainer.tsx` - Main chat UI
- `client/src/hooks/useResponsive.ts` - Responsive design hook

## Development Notes

### TypeScript Configuration
- Backend: `server/tsconfig.json` - CommonJS, ES2020 target
- Frontend: Uses Vite with React plugin, TypeScript

### Vite Proxy
Frontend dev server proxies `/api` to `http://localhost:3001`

### File Uploads
- Uses Multer middleware
- Files stored in `server/database/uploads/` (ensure directory exists)
- File metadata stored in messages table

### Message Recall
- 2-minute recall window
- Client-side check (no server-side enforcement visible)
- Uses `is_recalled` and `recalled_at` fields (migration-ready)

### Environment Variables
Create `server/.env`:
```
PORT=3001
DATABASE_PATH=./database/chat.db
NODE_ENV=development
```

## Testing Approach

No dedicated test framework found. Development testing:
1. Start both servers: `npm run dev`
2. Open multiple browser tabs to simulate multiple users
3. Test room creation/joining
4. Test message sending and polling
5. Test file uploads

## Common Issues & Solutions

### Database Locked
SQLite can lock during concurrent writes. The wrapper uses promises but concurrent operations may need retry logic.

### CORS Issues
Backend configured for `localhost:5173` and `localhost:3000`. Update `server/src/app.ts` if using different ports.

### Polling Not Working
Check that `lastMessageId` is being tracked correctly in `MessagePoller.ts`. Initial load sets this from `/latest` endpoint.

### File Upload Fails
Ensure `server/database/uploads/` directory exists and server has write permissions.

## Future Considerations

Based on the README, planned features include:
- User online status display
- Room admin functionality
- Message history persistence
- Theme switching
- WebSocket migration (mentioned as completed in README but not visible in code)

The current implementation uses HTTP polling (1-second interval) which is lightweight but may need WebSocket upgrade for production scale.