# Database Schema Reference

Complete database schema for the Web Chat System.

## Database Type
**PostgreSQL** - Production-grade relational database

## Database Location
```
Production: Neon Cloud Database (https://console.neon.tech)
Connection: Configured via POSTGRES_URL environment variable
```

## Tables

### 1. users

User registration and tracking table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Internal user identifier |
| user_id | VARCHAR(50) | UNIQUE, NOT NULL | User-provided identifier |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

**Purpose:** Track registered users without requiring formal authentication.

**Indexes:**
```sql
CREATE INDEX idx_users_user_id ON users(user_id);
```

**Example Records:**
```sql
INSERT INTO users (user_id) VALUES ('alice123');
INSERT INTO users (user_id) VALUES ('bob456');
```

**Query Examples:**
```sql
-- Check if user exists
SELECT id, user_id FROM users WHERE user_id = 'alice123';

-- Get user by ID
SELECT * FROM users WHERE id = 1;

-- Register new user
INSERT INTO users (user_id) VALUES ('newuser789');

-- Get user creation date
SELECT user_id, created_at FROM users WHERE user_id = 'alice123';
```

---

### 2. rooms

Chat room configuration table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Internal room identifier |
| room_code | CHAR(6) | UNIQUE, NOT NULL | 6-digit room number |
| room_name | TEXT | DEFAULT '私密房间' | Display name |
| created_by | VARCHAR(50) | - | Creator's user ID |
| admin_users | TEXT | - | JSON array of admin user IDs |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| is_public | BOOLEAN | DEFAULT false | Public/private flag |

**Purpose:** Manage both public lobby and private chat rooms.

**Special Cases:**
- **Public Lobby**: `id=0`, `room_code='PUBLIC'`, `is_public=true`, `room_name='公共大厅'`
- **Private Rooms**: `id>0`, `room_code='000000'-'999999'`, `is_public=false`

**Indexes:**
```sql
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_rooms_is_public ON rooms(is_public);
```

**Example Records:**
```sql
-- Public lobby (auto-created)
INSERT INTO rooms (id, room_code, room_name, is_public)
VALUES (0, 'PUBLIC', '公共大厅', 1);

-- Private room
INSERT INTO rooms (room_code, room_name, created_by, is_public)
VALUES ('123456', '私密房间', 'alice123', 0);
```

**Query Examples:**
```sql
-- Get public lobby
SELECT * FROM rooms WHERE id = 0;

-- Find room by code
SELECT * FROM rooms WHERE room_code = '123456';

-- Create private room
INSERT INTO rooms (room_code, room_name, created_by, is_public)
VALUES ('654321', '我的房间', 'bob456', 0);

-- Check if room exists
SELECT COUNT(*) FROM rooms WHERE room_code = '123456';

-- Get all public rooms
SELECT * FROM rooms WHERE is_public = 1;

-- Get rooms created by user
SELECT * FROM rooms WHERE created_by = 'alice123';
```

**Room Code Validation:**
```sql
-- Valid format check (6 digits)
SELECT * FROM rooms WHERE room_code REGEXP '^[0-9]{6}$';
```

---

### 3. user_status

User online presence and current room tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Internal identifier |
| user_id | VARCHAR(50) | UNIQUE, NOT NULL | User identifier |
| room_id | INTEGER | FOREIGN KEY → rooms.id | Current room |
| is_online | BOOLEAN | DEFAULT false | Online status flag |
| last_seen | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last activity timestamp |

**Purpose:** Track user presence and current room for online status features.

**Indexes:**
```sql
CREATE INDEX idx_user_status_user_id ON user_status(user_id);
CREATE INDEX idx_user_status_room_id ON user_status(room_id);
CREATE INDEX idx_user_status_is_online ON user_status(is_online);
```

**Example Records:**
```sql
INSERT INTO user_status (user_id, room_id, is_online)
VALUES ('alice123', 1, 1);

INSERT INTO user_status (user_id, room_id, is_online)
VALUES ('bob456', 0, 0);
```

**Query Examples:**
```sql
-- Get user's current status
SELECT * FROM user_status WHERE user_id = 'alice123';

-- Get all online users in a room
SELECT us.*, r.room_name
FROM user_status us
JOIN rooms r ON us.room_id = r.id
WHERE us.room_id = 1 AND us.is_online = 1;

-- Mark user as online
UPDATE user_status
SET is_online = 1, last_seen = CURRENT_TIMESTAMP
WHERE user_id = 'alice123';

-- Mark user as offline
UPDATE user_status
SET is_online = 0, last_seen = CURRENT_TIMESTAMP
WHERE user_id = 'alice123';

-- Update user's current room
UPDATE user_status
SET room_id = 2, last_seen = CURRENT_TIMESTAMP
WHERE user_id = 'alice123';

-- Get all online users
SELECT * FROM user_status WHERE is_online = 1;

-- Get room activity count
SELECT room_id, COUNT(*) as active_users
FROM user_status
WHERE is_online = 1
GROUP BY room_id;

-- Clean up inactive users (older than 1 hour)
DELETE FROM user_status
WHERE last_seen < NOW() - INTERVAL '1 hour';
```

**Presence Detection:**
```sql
-- Get users who were active in last 5 minutes
SELECT * FROM user_status
WHERE last_seen > NOW() - INTERVAL '5 minutes';
```

---

### 4. messages

Chat message storage with support for text and file attachments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Message identifier (used for polling) |
| room_id | INTEGER | FOREIGN KEY → rooms.id, NOT NULL | Target room |
| user_id | VARCHAR(50) | NOT NULL | Sender's user ID |
| content | TEXT | NOT NULL | Message text or file description |
| message_type | VARCHAR(20) | DEFAULT 'text' | Type: 'text', 'image', 'file' |
| file_name | TEXT | - | Original filename (if file) |
| file_size | INTEGER | - | File size in bytes (if file) |
| file_url | TEXT | - | Download URL (if file) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Message timestamp |

**Purpose:** Store all chat messages with incremental ID support for efficient polling.

**Message Types:**
- `text`: Plain text message
- `image`: Image file upload
- `file`: Generic file upload (documents, etc.)

**Indexes:**
```sql
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_id ON messages(id);
```

**Example Records:**
```sql
-- Text message
INSERT INTO messages (room_id, user_id, content, message_type)
VALUES (1, 'alice123', 'Hello world!', 'text');

-- Image message
INSERT INTO messages (room_id, user_id, content, message_type, file_name, file_size, file_url)
VALUES (1, 'bob456', 'Check out this photo', 'image', 'photo.jpg', 102400, '/uploads/1234567890-photo.jpg');

-- File message
INSERT INTO messages (room_id, user_id, content, message_type, file_name, file_size, file_url)
VALUES (1, 'alice123', 'Here is the document', 'file', 'report.pdf', 512000, '/uploads/1234567891-report.pdf');
```

**Query Examples:**
```sql
-- Get latest messages in room
SELECT * FROM messages
WHERE room_id = 1
ORDER BY created_at DESC
LIMIT 50;

-- Get messages after specific ID (polling)
SELECT * FROM messages
WHERE room_id = 1 AND id > 100
ORDER BY id ASC;

-- Get message history with pagination
SELECT * FROM messages
WHERE room_id = 1
ORDER BY id DESC
LIMIT 20 OFFSET 0;

-- Send new message
INSERT INTO messages (room_id, user_id, content, message_type)
VALUES (1, 'alice123', 'New message', 'text');

-- Get messages from specific user in room
SELECT * FROM messages
WHERE room_id = 1 AND user_id = 'alice123'
ORDER BY created_at DESC;

-- Get message count per room
SELECT room_id, COUNT(*) as message_count
FROM messages
GROUP BY room_id;

-- Get messages by type
SELECT * FROM messages
WHERE room_id = 1 AND message_type = 'image'
ORDER BY created_at DESC;

-- Search messages
SELECT * FROM messages
WHERE room_id = 1 AND content LIKE '%keyword%'
ORDER BY created_at DESC;

-- Delete old messages (cleanup)
DELETE FROM messages
WHERE created_at < NOW() - INTERVAL '30 days';

-- Get latest message in room
SELECT * FROM messages
WHERE room_id = 1
ORDER BY id DESC
LIMIT 1;
```

**File Handling:**
```sql
-- Get all file messages in room
SELECT * FROM messages
WHERE room_id = 1 AND message_type IN ('image', 'file')
ORDER BY created_at DESC;

-- Calculate total storage used
SELECT SUM(file_size) as total_size
FROM messages
WHERE message_type IN ('image', 'file');
```

---

## Relationships

### Entity Relationship Diagram

```
users (1) ----< (N) messages
                     |
                     |
rooms (1) ----< (N) messages
   |
   +--< (N) user_status
```

**Foreign Keys:**
- `messages.room_id` → `rooms.id`
- `user_status.room_id` → `rooms.id`

**Cascading Behavior:**
- Deleting a room does NOT cascade to messages (preserve history)
- Deleting a user does NOT cascade (preserve message attribution)

---

## Initialization

### Database Setup Script

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_code CHAR(6) UNIQUE NOT NULL,
    room_name TEXT DEFAULT '私密房间',
    created_by VARCHAR(50),
    admin_users TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT false
);

-- Create user_status table
CREATE TABLE IF NOT EXISTS user_status (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    room_id INTEGER REFERENCES rooms(id),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    file_name TEXT,
    file_size INTEGER,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_is_public ON rooms(is_public);
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_room_id ON user_status(room_id);
CREATE INDEX IF NOT EXISTS idx_user_status_is_online ON user_status(is_online);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_id ON messages(id);

-- Insert public lobby
INSERT INTO rooms (id, room_code, room_name, is_public)
VALUES (0, 'PUBLIC', '公共大厅', true)
ON CONFLICT (id) DO NOTHING;
```

---

## Migration Guide

### Adding New Columns

```sql
-- Example: Add email column to users
ALTER TABLE users ADD COLUMN email TEXT;

-- Update existing records if needed
UPDATE users SET email = NULL WHERE email IS NULL;
```

### Creating New Tables

```sql
-- Example: Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);
```

### Backwards Compatibility

- Always use `IF NOT EXISTS` for table creation
- Use `OR IGNORE` for inserting default data
- Make column additions optional (DEFAULT values)
- Maintain existing indexes when adding new ones

---

## Performance Optimization

### Query Optimization

**Use Indexes:**
```sql
-- Fast lookup by room
SELECT * FROM messages WHERE room_id = 1;

-- Fast lookup by user
SELECT * FROM user_status WHERE user_id = 'alice123';
```

**Avoid Full Table Scans:**
```sql
-- Good (indexed)
SELECT * FROM messages WHERE id > 100;

-- Bad (full scan)
SELECT * FROM messages WHERE content LIKE '%search%';
```

### Database Maintenance

```sql
-- Check table sizes
SELECT relname, pg_size_pretty(pg_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_relation_size(relid) DESC;

-- Vacuum analyze for performance
VACUUM ANALYZE;

-- Check for index bloat
SELECT schemaname, tablename, indexname, pg_size_pretty(indexsize), idx_scan
FROM pg_stat_user_indexes
ORDER BY indexsize DESC;
```

### Cleanup Jobs (PostgreSQL)

```sql
-- Delete messages older than 30 days
DELETE FROM messages
WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete inactive users (no activity for 7 days)
DELETE FROM user_status
WHERE last_seen < NOW() - INTERVAL '7 days';
```

---

## Backup and Restore

### Backup (Neon Cloud)

**Automated Backups:**
Neon automatically creates daily backups. You can restore from the Neon console.

**Manual Export:**
```bash
# Export using pg_dump
pg_dump "${POSTGRES_URL}" > backup-$(date +%Y%m%d).sql

# Or using connection string
pg_dump "postgres://user:password@host:5432/database" > backup.sql
```

### Restore
```bash
# Restore from SQL dump
psql "${POSTGRES_URL}" < backup-20240101.sql
```

### Scheduled Backup Script

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"

mkdir -p $BACKUP_DIR

# pg_dump with compression
pg_dump "${POSTGRES_URL}" | gzip > $BACKUP_DIR/chat-$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "chat-*.sql.gz" -mtime +7 -delete

echo "Backup completed: chat-$DATE.sql.gz"
```

---

## Security Considerations

### SQL Injection Prevention

**Good (Parameterized):**
```typescript
db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
```

**Bad (String Concatenation):**
```typescript
db.query(`SELECT * FROM users WHERE user_id = '${userId}'`);
```

**Important:** PostgreSQL uses `$1, $2, ...` for parameterized queries.

### Data Validation

**Always validate inputs before database operations:**
- Room codes: Must be 6 digits
- Message content: 1-500 characters
- User IDs: Non-empty strings
- File sizes: Maximum 10MB

### Access Control

- Public data: No authentication required
- Private rooms: Access via room code only
- File uploads: Validate size and type
- Admin functions: Check admin_users field

---

## Monitoring Queries

### System Health

```sql
-- Total users
SELECT COUNT(*) FROM users;

-- Total rooms
SELECT COUNT(*) FROM rooms;

-- Total messages
SELECT COUNT(*) FROM messages;

-- Online users
SELECT COUNT(*) FROM user_status WHERE is_online = 1;

-- Most active rooms
SELECT r.room_name, COUNT(m.id) as msg_count
FROM rooms r
LEFT JOIN messages m ON r.id = m.room_id
GROUP BY r.id
ORDER BY msg_count DESC
LIMIT 10;
```

### Performance Metrics

```sql
-- Average messages per room
SELECT AVG(msg_count) as avg_messages
FROM (
    SELECT room_id, COUNT(*) as msg_count
    FROM messages
    GROUP BY room_id
);

-- Storage usage
SELECT
    SUM(CASE WHEN file_size IS NOT NULL THEN file_size ELSE 0 END) as total_bytes,
    SUM(CASE WHEN file_size IS NOT NULL THEN 1 ELSE 0 END) as file_count
FROM messages;
```
