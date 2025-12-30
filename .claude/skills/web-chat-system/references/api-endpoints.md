# API Endpoints Reference

Complete reference for all Web Chat System API endpoints.

## Base URL
```
Development: http://localhost:3001/api
Production: /api (when proxied)
```

## Response Format

All endpoints return JSON with the following structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Room Management Endpoints

### 1. Get Public Lobby

```http
GET /api/rooms/public
```

**Description:** Returns information about the public lobby room.

**Response:**
```json
{
  "success": true,
  "roomId": 0,
  "roomName": "公共大厅"
}
```

**Notes:**
- Public lobby has ID 0
- All users can access
- No authentication required

---

### 2. Create Private Room

```http
POST /api/rooms/create
Content-Type: application/json
```

**Request Body:**
```json
{
  "roomCode": "123456",
  "userId": "user123"
}
```

**Parameters:**
- `roomCode` (string, required): 6-digit room number (000000-999999)
- `userId` (string, required): Creator's user ID

**Success Response:**
```json
{
  "success": true,
  "roomId": 1,
  "roomName": "私密房间"
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "房间号必须是6位数字"
}
```

```json
{
  "success": false,
  "message": "房间已存在"
}
```

**Validation Rules:**
- Room code must be exactly 6 digits
- Room code must be numeric only
- Room code cannot already exist in database

---

### 3. Join Room

```http
GET /api/rooms/join/:roomCode
```

**Parameters:**
- `roomCode` (path parameter, required): 6-digit room number

**Example:**
```http
GET /api/rooms/join/123456
```

**Success Response:**
```json
{
  "success": true,
  "roomId": 1,
  "roomName": "私密房间"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "房间不存在"
}
```

**Behavior:**
- Returns room information if exists
- Returns error if room not found
- Does not create room automatically

---

## Message Management Endpoints

### 4. Send Message

```http
POST /api/messages/send
Content-Type: application/json
```

**Request Body:**
```json
{
  "roomId": 1,
  "userId": "user123",
  "content": "Hello, world!"
}
```

**Parameters:**
- `roomId` (number, required): Target room ID
- `userId` (string, required): Sender's user ID
- `content` (string, required): Message text (1-500 characters)

**Success Response:**
```json
{
  "success": true,
  "messageId": 101
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "消息内容不能为空"
}
```

```json
{
  "success": false,
  "message": "消息内容不能超过500字符"
}
```

```json
{
  "success": false,
  "message": "房间不存在"
}
```

**Validation Rules:**
- Content must not be empty after trimming
- Content length must be 1-500 characters
- Room must exist (public lobby exempted)
- Message is broadcast to all SSE subscribers

---

### 5. Get Latest Messages (Initial Load)

```http
GET /api/messages/:roomId/latest?limit=50
```

**Parameters:**
- `roomId` (path parameter, required): Room ID
- `limit` (query parameter, optional): Number of messages (default: 50)

**Example:**
```http
GET /api/messages/1/latest?limit=50
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": 99,
      "userId": "user123",
      "content": "Earlier message",
      "messageType": "text",
      "fileName": null,
      "fileUrl": null,
      "createdAt": "2024-01-01 11:55:00"
    },
    {
      "id": 100,
      "userId": "user456",
      "content": "Latest message",
      "messageType": "text",
      "fileName": null,
      "fileUrl": null,
      "createdAt": "2024-01-01 12:00:00"
    }
  ]
}
```

**Behavior:**
- Returns most recent messages in the room
- Ordered by creation time (newest last)
- Used for initial message loading
- Limited by query parameter

---

### 6. Get Messages (Polling)

```http
GET /api/messages/:roomId?lastMessageId=100
```

**Parameters:**
- `roomId` (path parameter, required): Room ID
- `lastMessageId` (query parameter, optional): Client's last known message ID

**Example:**
```http
GET /api/messages/1?lastMessageId=100
```

**Response (Has New Messages):**
```json
{
  "success": true,
  "hasNew": true,
  "messages": [
    {
      "id": 101,
      "userId": "user123",
      "content": "Hello",
      "messageType": "text",
      "fileName": null,
      "fileUrl": null,
      "createdAt": "2024-01-01 12:00:00"
    },
    {
      "id": 102,
      "userId": "user456",
      "content": "Hi!",
      "messageType": "text",
      "fileName": null,
      "fileUrl": null,
      "createdAt": "2024-01-01 12:00:05"
    }
  ]
}
```

**Response (No New Messages):**
```json
{
  "success": true,
  "hasNew": false,
  "messages": []
}
```

**Behavior:**
- Returns messages with ID greater than lastMessageId
- If lastMessageId not provided, returns all messages
- Ordered by ID ascending
- Used for HTTP polling fallback

---

## Server-Sent Events Endpoints

### 7. Establish SSE Connection

```http
GET /api/sse/:roomId?userId=user123
```

**Parameters:**
- `roomId` (path parameter, required): Room ID to join
- `userId` (query parameter, required): User identifier

**Example:**
```http
GET /api/sse/1?userId=user123
```

**Response:** Server-Sent Events stream

**Event Types:**

#### Connected Event
```
data: {"type":"connected","data":{"roomId":1,"userId":"user123","timestamp":"2024-01-01T12:00:00.000Z"}}

```

Sent immediately after connection established.

#### New Message Event
```
data: {"type":"newMessage","data":{"id":101,"userId":"user123","content":"Hello World","messageType":"text","createdAt":"2024-01-01T12:00:00.000Z"}}

```

Sent when any user sends a message to the room.

#### User Status Event
```
data: {"type":"userStatus","data":{"userId":"user456","status":"online","timestamp":"2024-01-01T12:00:00.000Z"}}

```

Sent when user status changes (online/offline).

#### Error Event
```
data: {"type":"error","data":{"message":"Room not found","code":"ROOM_NOT_FOUND"}}

```

Sent when an error occurs.

**Behavior:**
- Maintains persistent connection
- Automatically reconnects on disconnect
- Broadcasts messages to all room subscribers
- Room subscription managed server-side

**Client Implementation:**
```javascript
const eventSource = new EventSource('/api/sse/1?userId=user123');

eventSource.onmessage = (event) => {
  const sseEvent = JSON.parse(event.data);
  handleEvent(sseEvent);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // Auto-reconnect handled by browser
};
```

---

### 8. Get SSE Statistics

```http
GET /api/sse/stats
```

**Description:** Returns current SSE connection statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "0": 5,
    "1": 3,
    "2": 1
  }
}
```

**Field Description:**
- Keys: Room IDs
- Values: Number of active SSE connections in that room

**Use Cases:**
- Monitoring server load
- Debugging connection issues
- Analytics and reporting

---

## File Management Endpoints

### 9. Upload File

```http
POST /api/files/upload
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <binary data>
```

**Parameters:**
- `file` (file, required): File to upload

**Constraints:**
- Maximum file size: 10MB (10,485,760 bytes)
- Supported types: All (validation in controller)
- File name sanitized on upload

**Success Response:**
```json
{
  "success": true,
  "fileUrl": "/uploads/1703654400000-filename.jpg",
  "fileName": "filename.jpg",
  "fileSize": 102400
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "File size exceeds maximum limit (10MB)"
}
```

**Behavior:**
- File saved to `uploads/` directory
- File renamed with timestamp prefix
- Returns URL accessible via GET endpoint
- No file type validation (all allowed)

---

### 10. Download File

```http
GET /api/files/:filename
```

**Parameters:**
- `filename` (path parameter, required): Uploaded file name

**Example:**
```http
GET /api/files/1703654400000-filename.jpg
```

**Response:** File binary data with appropriate Content-Type header

**Behavior:**
- Serves file from `uploads/` directory
- Sets correct Content-Type based on file extension
- Returns 404 if file not found

---

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 200 | SUCCESS | Request successful |
| 400 | BAD_REQUEST | Invalid request parameters |
| 404 | NOT_FOUND | Resource not found |
| 500 | INTERNAL_ERROR | Server error |

## Common Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| "房间号必须是6位数字" | Invalid room code format | Use exactly 6 digits (000000-999999) |
| "房间已存在" | Room already exists | Choose a different room code |
| "房间不存在" | Room not found | Verify room code or create new room |
| "消息内容不能为空" | Empty message | Provide message content |
| "消息内容不能超过500字符" | Message too long | Reduce message length |
| "服务器错误" | Server error | Check server logs and retry |

## Rate Limiting

Not implemented by default. Recommended limits:
- Messages: 10 per minute per user
- File uploads: 5 per minute per user
- Room creation: 3 per minute per user

Implement using `express-rate-limit` middleware.

## CORS Configuration

**Development:**
- Allow all origins for testing

**Production:**
- Restrict to frontend domain
- Enable credentials if needed

Example:
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

## WebSocket vs SSE

This system uses SSE instead of WebSocket for:
- Simpler implementation
- Better browser compatibility
- Native HTTP protocol
- Automatic reconnection

WebSocket would be better for:
- Bidirectional communication
- Lower latency requirements
- Binary data streaming
