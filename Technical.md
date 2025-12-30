# 网页聊天系统技术文档

## 一、项目概述

### 1.1 项目名称
轻量级网页聊天系统（Web Chat System）

### 1.2 项目目标
开发一个无需注册登录的轻量级网页聊天系统，支持公共聊天室和私密房间功能，使用 **Server-Sent Events (SSE)** 实现实时消息推送。

### 1.3 技术特点
- 无用户注册流程，使用自定义ID快速接入
- 6位数字房间号系统，支持私密聊天
- **SSE实时消息推送**（替代HTTP轮询）
- SQLite轻量级数据库存储
- **React Context + useReducer** 状态管理
- **Axios** HTTP客户端
- **Multer** 文件上传处理
- React + Node.js 全栈TypeScript架构
- 支持文件上传（图片、文档等，最大10MB）
- 数据库自动迁移机制
- CSS Modules 组件化样式

### 1.4 项目状态
✅ **已完成并投入使用**
- 核心聊天功能完整实现
- **SSE实时通信**正常
- 文件上传功能正常
- 数据库结构稳定
- 前后端API对接完成
- 响应式UI适配完成
- 状态管理优化完成

---

## 二、系统架构设计

### 2.1 整体架构图
```
┌─────────────────────────────────────────┐
│           前端 (React 18)                │
│  ┌───────────────────────────────────┐  │
│  │  App (ChatContext.Provider)       │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  ChatContainer              │  │  │
│  │  │  ├─ ChatHeader              │  │  │
│  │  │  ├─ RoomSelector            │  │  │
│  │  │  ├─ MessageList             │  │  │
│  │  │  ├─ MessageInput            │  │  │
│  │  │  └─ ConnectionStatus        │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  SSEManager (EventSource)         │  │
│  └───────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │ HTTP/JSON + SSE流
┌────────────────▼────────────────────────┐
│        后端 (Express + Node.js)         │
│  ┌───────────────────────────────────┐  │
│  │  app.ts (Express应用)             │  │
│  │  ┌─────────┐  ┌─────────┐        │  │
│  │  │路由处理 │  │SSE管理器 │        │  │
│  │  └─────────┘  └─────────┘        │  │
│  │  ┌─────────┐  ┌─────────┐        │  │
│  │  │控制器   │  │业务逻辑 │        │  │
│  │  └─────────┘  └─────────┘        │  │
│  └───────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │ SQL
┌────────────────▼────────────────────────┐
│          数据库 (SQLite3)               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ users   │  │ rooms   │  │messages │ │
│  │ status  │  │         │  │         │ │
│  └─────────┘  └─────────┘  └─────────┘ │
└─────────────────────────────────────────┘

数据流:
1. 用户操作 → HTTP请求 → Express路由 → 控制器
2. 控制器 → 数据库操作 → 响应
3. 发送消息 → SSE广播 → 所有订阅客户端
4. 房间切换 → 断开旧SSE → 建立新SSE
```

### 2.2 技术栈详情

#### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型系统 |
| Axios | 1.x | HTTP客户端 |
| Vite | 4.x | 构建工具 |
| CSS Modules | - | 样式管理 |
| React Context | - | 状态管理 |
| EventSource | - | SSE客户端 |

#### 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18.x/20.x | 运行时环境 |
| Express | 4.x | Web框架 |
| SQLite3 | 5.x | 数据库 |
| TypeScript | 5.x | 类型系统 |
| Multer | 2.x | 文件上传 |
| CORS | 2.x | 跨域中间件 |

#### 包管理器
| 工具 | 版本 | 用途 |
|------|------|------|
| Bun | 1.0+ | 包管理 & 运行时 |

---

## 三、数据库设计

### 3.1 数据库ER图
```
users (用户表)
├── id (PK)
├── user_id (UNIQUE)
└── created_at

rooms (房间表)
├── id (PK)
├── room_code (UNIQUE, 6位数字)
├── room_name
├── created_by
├── admin_users (JSON)
├── created_at
└── is_public

user_status (用户状态表)
├── id (PK)
├── user_id (UNIQUE)
├── room_id (FK)
├── is_online
└── last_seen

messages (消息表)
├── id (PK)
├── room_id (FK → rooms.id)
├── user_id
├── content
├── message_type
├── file_name
├── file_size
├── file_url
└── created_at
```

### 3.2 表结构详细说明

#### users 表
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明：**
- `id`: 自增主键
- `user_id`: 用户自定义ID（唯一标识）
- `created_at`: 创建时间

**索引：**
```sql
CREATE INDEX idx_users_user_id ON users(user_id);
```

#### rooms 表
```sql
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_code CHAR(6) UNIQUE NOT NULL,
    room_name TEXT DEFAULT '私密房间',
    created_by TEXT,
    admin_users TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT 0
);
```

**字段说明：**
- `id`: 自增主键
- `room_code`: 6位数字房间号
- `room_name`: 房间名称
- `created_by`: 创建者user_id
- `admin_users`: 管理员列表（JSON格式）
- `is_public`: 是否为公共大厅（0=私密，1=公共）

**特殊约定：**
- 公共大厅房间号固定为 "PUBLIC"，id = 0
- 公共大厅 is_public = 1

#### user_status 表
```sql
CREATE TABLE user_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    room_id INTEGER,
    is_online BOOLEAN DEFAULT 1,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
```

**字段说明：**
- `id`: 自增主键
- `user_id`: 用户ID
- `room_id`: 当前所在房间
- `is_online`: 是否在线
- `last_seen`: 最后活跃时间

#### messages 表
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    file_name TEXT,
    file_size INTEGER,
    file_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
```

**字段说明：**
- `id`: 自增主键（用于增量获取）
- `room_id`: 房间ID
- `user_id`: 发送者ID
- `content`: 消息内容
- `message_type`: 消息类型（text/image/file）
- `file_name`: 文件名
- `file_size`: 文件大小
- `file_url`: 文件URL
- `created_at`: 发送时间

**索引：**
```sql
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

---

## 四、API接口规范

### 4.1 基础配置
- **Base URL**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **跨域**: 支持

### 4.2 房间管理接口

#### 1) 获取公共大厅信息
**GET** `/api/rooms/public`

**响应示例：**
```json
{
    "success": true,
    "roomId": 0,
    "roomName": "公共大厅"
}
```

#### 2) 创建私密房间
**POST** `/api/rooms/create`

**请求体：**
```json
{
    "roomCode": "123456",
    "userId": "user123"
}
```

**响应示例（成功）：**
```json
{
    "success": true,
    "roomId": 1,
    "roomName": "私密房间"
}
```

#### 3) 加入房间
**GET** `/api/rooms/join/:roomCode`

**响应示例（成功）：**
```json
{
    "success": true,
    "roomId": 1,
    "roomName": "私密房间"
}
```

### 4.3 消息管理接口

#### 1) 发送消息
**POST** `/api/messages/send`

**请求体：**
```json
{
    "roomId": 1,
    "userId": "user123",
    "content": "Hello World",
    "messageType": "text"
}
```

**文件消息：**
```json
{
    "roomId": 1,
    "userId": "user123",
    "content": "[文件]",
    "messageType": "image",
    "fileName": "photo.jpg",
    "fileSize": 102400,
    "fileUrl": "/uploads/1703654400000-photo.jpg"
}
```

#### 2) 获取最新消息（初始加载）
**GET** `/api/messages/:roomId/latest?limit=50`

**响应示例：**
```json
{
    "success": true,
    "messages": [
        {
            "id": 99,
            "userId": "user123",
            "content": "Hello",
            "messageType": "text",
            "createdAt": "2024-01-01T11:55:00.000Z"
        }
    ]
}
```

#### 3) 获取房间消息（轮询接口 - 备用）
**GET** `/api/messages/:roomId?lastMessageId=100`

**响应示例：**
```json
{
    "success": true,
    "hasNew": true,
    "messages": [...]
}
```

### 4.4 Server-Sent Events (SSE) 接口

#### 1) 建立SSE连接
**GET** `/api/sse/:roomId?userId=<userId>`

**请求示例：**
```http
GET /api/sse/1?userId=user123
```

**响应：** Server-Sent Events 流

**事件类型：**

1. **连接确认事件**
```json
{
    "type": "connected",
    "data": {
        "roomId": 1,
        "userId": "user123",
        "timestamp": "2024-01-01T12:00:00.000Z"
    }
}
```

2. **新消息事件**
```json
{
    "type": "newMessage",
    "data": {
        "id": 101,
        "userId": "user123",
        "content": "Hello World",
        "messageType": "text",
        "createdAt": "2024-01-01T12:00:00.000Z"
    }
}
```

3. **用户状态事件**
```json
{
    "type": "userStatus",
    "data": {
        "userId": "user456",
        "status": "online",
        "timestamp": "2024-01-01T12:00:00.000Z"
    }
}
```

4. **错误事件**
```json
{
    "type": "error",
    "data": {
        "message": "房间不存在",
        "code": "ROOM_NOT_FOUND"
    }
}
```

#### 2) 获取SSE连接统计
**GET** `/api/sse/stats`

**响应示例：**
```json
{
    "success": true,
    "data": {
        "0": 5,    // 公共大厅订阅者数量
        "1": 3,    // 房间1订阅者数量
        "2": 1     // 房间2订阅者数量
    }
}
```

### 4.5 文件管理接口

#### 1) 上传文件
**POST** `/api/files/upload`

**请求：** multipart/form-data
- `file`: 文件数据

**响应示例：**
```json
{
    "success": true,
    "fileUrl": "/uploads/1703654400000-filename.jpg",
    "fileName": "filename.jpg",
    "fileSize": 102400
}
```

#### 2) 下载文件
**GET** `/api/files/:filename`

**响应：** 文件二进制数据

---

## 五、前端架构设计

### 5.1 组件结构
```
App (ChatContext.Provider)
├── LoginForm (登录表单)
├── NicknameForm (昵称设置)
└── ChatContainer (聊天主容器)
    ├── ChatHeader (头部 + 登出)
    ├── RoomSelector (房间切换)
    ├── MessageList (消息列表)
    │   └── MessageBubble (单条消息)
    ├── MessageInput (输入 + 文件上传)
    └── ConnectionStatus (SSE状态指示器)
```

### 5.2 状态管理 (React Context + useReducer)

**实现位置:** `client/src/context/ChatContext.tsx`

**状态结构:**
```typescript
interface AppState {
    currentUser: string;      // 当前用户ID
    currentRoom: Room;        // 当前房间
    messages: Message[];      // 消息列表
    rooms: Room[];            // 已加入房间
    isConnected: boolean;     // 连接状态
    isLoading: boolean;       // 加载状态
}

interface Room {
    id: number;
    name: string;
    code?: string;
    isPublic: boolean;
}

interface Message {
    id: number;
    userId: string;
    content: string;
    messageType: 'text' | 'image' | 'file';
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
    createdAt: string;
}
```

**Action类型:**
```typescript
type ChatAction =
    | { type: 'SET_USER'; payload: string }
    | { type: 'SET_ROOM'; payload: Room }
    | { type: 'SET_MESSAGES'; payload: Message[] }
    | { type: 'ADD_MESSAGES'; payload: Message[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CONNECTED'; payload: boolean };
```

### 5.3 SSEManager 类

**实现位置:** `client/src/utils/SSEManager.ts`

```typescript
class SSEManager {
    private eventSource: EventSource | null = null;
    private roomId: number | null = null;
    private userId: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // 1秒

    // 连接到SSE
    connect(roomId: number, userId: string): void

    // 断开连接
    disconnect(): void

    // 更新房间
    updateRoomId(newRoomId: number): void

    // 检查连接状态
    isConnected(): boolean

    // 获取连接状态描述
    getConnectionState(): string

    // 销毁管理器
    destroy(): void
}
```

**使用示例:**
```typescript
const sseManager = new SSEManager(
    (messages) => {
        // 新消息回调
        setMessages(prev => [...prev, ...messages]);
    },
    (data) => {
        // 连接成功回调
        console.log('SSE连接成功:', data);
    },
    (error) => {
        // 连接错误回调
        console.error('SSE连接错误:', error);
    }
);

// 连接到房间
sseManager.connect(roomId, userId);

// 切换房间
sseManager.updateRoomId(newRoomId);

// 清理
sseManager.destroy();
```

### 5.4 API客户端

**实现位置:** `client/src/utils/api.ts`

```typescript
const api = axios.create({
    baseURL: API_CONFIG.baseURL + '/api',
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器 - 日志记录
api.interceptors.request.use(...)

// 响应拦截器 - 错误处理
api.interceptors.response.use(...)

export const roomAPI = {
    getPublicRoom: async () => {...},
    createRoom: async (roomCode, userId) => {...},
    joinRoom: async (roomCode) => {...},
};

export const messageAPI = {
    sendMessage: async (messageData) => {...},
    getMessages: async (roomId, lastMessageId) => {...},
    getLatestMessages: async (roomId, limit) => {...},
};
```

---

## 六、后端架构设计

### 6.1 项目目录结构
```
server/
├── src/
│   ├── controllers/        # 控制器
│   │   ├── roomController.ts     # 房间管理
│   │   ├── messageController.ts  # 消息处理
│   │   ├── fileController.ts     # 文件上传
│   │   └── sseController.ts      # SSE连接管理
│   ├── routes/             # 路由定义
│   │   ├── roomRoutes.ts
│   │   ├── messageRoutes.ts
│   │   ├── fileRoutes.ts
│   │   └── sseRoutes.ts
│   ├── database/           # 数据库
│   │   ├── init.ts         # 数据库初始化
│   │   └── migrate.ts      # 数据库迁移
│   ├── utils/              # 工具类
│   │   ├── database.ts     # 数据库连接
│   │   └── SSEManager.ts   # SSE服务端管理器
│   ├── types.ts            # TypeScript类型定义
│   └── app.ts              # Express应用入口
├── database/               # SQLite数据库文件
│   └── chat.db
├── uploads/                # 文件上传目录
├── .env                    # 环境变量
├── package.json
└── tsconfig.json
```

### 6.2 SSEManager (服务端)

**实现位置:** `server/src/utils/SSEManager.ts`

```typescript
class SSEManager {
    private static instance: SSEManager;
    private connections: Map<number, Map<string, Response>> = new Map();
    private roomSubscribers: Map<number, Set<string>> = new Map();

    // 单例模式
    static getInstance(): SSEManager

    // 添加SSE连接
    addConnection(roomId: number, userId: string, res: Response): void

    // 移除SSE连接
    removeConnection(roomId: number, userId: string): void

    // 向房间所有订阅者广播消息
    broadcastToRoom(roomId: number, event: any): void

    // 广播新消息
    broadcastNewMessage(roomId: number, message: Message): void

    // 广播用户状态变化
    broadcastUserStatus(roomId: number, userId: string, status: 'online' | 'offline'): void

    // 获取统计信息
    getStats(): { [key: number]: number }
}
```

### 6.3 核心控制器

#### 房间控制器
```typescript
export class RoomController {
    // 获取公共大厅
    async getPublicRoom(req: Request, res: Response)

    // 创建房间
    async createRoom(req: Request, res: Response)

    // 加入房间
    async joinRoom(req: Request, res: Response)
}
```

#### 消息控制器
```typescript
export class MessageController {
    // 发送消息 (触发SSE广播)
    async sendMessage(req: Request, res: Response)

    // 获取最新消息 (初始加载)
    async getLatestMessages(req: Request, res: Response)

    // 获取消息 (轮询备用)
    async getMessages(req: Request, res: Response)
}
```

#### SSE控制器
```typescript
export class SSEController {
    // 建立SSE连接
    async connect(req: Request, res: Response)

    // 获取连接统计
    async getStats(req: Request, res: Response)
}
```

### 6.4 消息发送流程

```
客户端发送消息 (POST /api/messages/send)
    ↓
控制器验证 (roomId, userId, content)
    ↓
数据库插入 (messages表)
    ↓
SSEManager广播 (broadcastNewMessage)
    ↓
所有订阅客户端接收 (newMessage事件)
    ↓
前端自动更新UI
```

---

## 七、核心业务逻辑

### 7.1 实时消息推送机制 (SSE)

#### 客户端实现流程
1. **连接建立**: `SSEManager.connect(roomId, userId)`
2. **发送请求**: `GET /api/sse/:roomId?userId=user123`
3. **服务器响应**: 设置SSE响应头，返回连接确认
4. **事件监听**:
   - `onopen`: 连接成功，重置重连计数
   - `onmessage`: 接收事件，解析JSON，分发处理
   - `onerror`: 连接错误，触发重连机制
5. **自动重连**: 指数退避，最多5次

#### 服务端实现流程
1. **接收请求**: 解析roomId和userId
2. **设置响应头**:
   ```
   Content-Type: text/event-stream
   Cache-Control: no-cache
   Connection: keep-alive
   ```
3. **发送初始事件**: connected事件
4. **存储连接**: 加入SSEManager
5. **监听断开**: req.on('close')清理连接

#### 消息广播流程
```
用户A发送消息
    ↓
控制器保存到数据库
    ↓
SSEManager.broadcastNewMessage(roomId, message)
    ↓
遍历roomSubscribers.get(roomId)
    ↓
向每个用户发送SSE事件
    ↓
所有客户端实时显示新消息
```

### 7.2 房间切换完整流程

```
1. 用户输入房间号
   ↓
2. 前端验证格式 (6位数字)
   ↓
3. 尝试加入: GET /api/rooms/join/:code
   ↓
   ├─ 成功 → 获取roomId
   └─ 失败 → 尝试创建: POST /api/rooms/create
       ↓
       ├─ 成功 → 获取roomId
       └─ 失败 → 显示错误
   ↓
4. 更新React Context (SET_ROOM)
   ↓
5. 清理旧消息列表
   ↓
6. 断开旧SSE连接 (sseManager.disconnect())
   ↓
7. 获取历史消息: GET /api/messages/:roomId/latest
   ↓
8. 建立新SSE连接 (sseManager.connect())
   ↓
9. 显示连接状态
   ↓
10. 等待SSE实时推送
```

### 7.3 文件上传流程

```
用户选择文件
    ↓
前端验证 (类型、大小 < 10MB)
    ↓
创建FormData
    ↓
POST /api/files/upload
    ↓
Multer中间件处理
    ↓
保存到server/uploads/
    ↓
返回fileUrl
    ↓
创建消息: POST /api/messages/send
    ↓
SSE广播文件消息
    ↓
前端渲染文件链接
```

### 7.4 状态管理流程

```
用户登录
    ↓
localStorage保存chat_user_id
    ↓
ChatContext SET_USER
    ↓
ChatContext SET_CONNECTED
    ↓
显示ChatContainer
    ↓
ChatContainer useEffect
    ↓
启动SSEManager
    ↓
连接到公共大厅
```

---

## 八、部署指南

### 8.1 环境要求
- **Node.js**: 18.0.0 或更高版本
- **Bun**: 1.0+ (推荐)
- **操作系统**: Windows/Linux/macOS

### 8.2 开发环境部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd web-chat-system

# 2. 安装依赖
bun run install:all

# 3. 配置环境变量
# server/.env
PORT=3001
DATABASE_PATH=./database/chat.db
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# client/.env
VITE_API_BASE_URL=/api
VITE_NODE_ENV=development

# 4. 启动开发服务器
bun run dev
# 或分别启动
bun run server:dev  # 端口3001
bun run client:dev  # 端口5173
```

### 8.3 生产环境部署

#### 后端部署
```bash
cd server
bun install
bun run build        # 编译TypeScript

# 使用PM2
bun install -g pm2
pm2 start dist/app.js --name chat-server
pm2 startup
pm2 save

# 或直接运行
bun start
```

#### 前端部署
```bash
cd client
bun install
bun run build        # 构建到dist/

# 部署dist/到Web服务器
# Nginx/Apache等
```

#### Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # SSE关键配置
        proxy_buffering off;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control no-cache;
        proxy_set_header X-Accel-Buffering no;
    }

    # 文件上传
    location /uploads/ {
        proxy_pass http://localhost:3001;
        client_max_body_size 10M;
    }
}
```

### 8.4 Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖并构建
RUN bun install
RUN bun run build

# 暴露端口
EXPOSE 3001

# 启动
CMD ["bun", "start"]
```

```bash
# 构建镜像
docker build -t web-chat-system .

# 运行容器
docker run -p 3001:3001 \
  -v $(pwd)/server/database:/app/server/database \
  -v $(pwd)/server/uploads:/app/server/uploads \
  web-chat-system
```

---

## 九、监控与维护

### 9.1 关键指标监控

| 指标 | 说明 | 监控方式 |
|------|------|----------|
| SSE连接数 | 当前活跃连接数 | `/api/sse/stats` |
| 消息延迟 | 消息发送到接收时间 | 日志记录 |
| 数据库查询时间 | 查询性能 | 慢查询日志 |
| API响应时间 | 接口响应速度 | 请求日志 |
| 错误率 | 5xx错误比例 | 错误监控 |

### 9.2 日志管理

```typescript
// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 错误日志
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
});
```

### 9.3 数据备份

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR
cp server/database/chat.db $BACKUP_DIR/chat-$DATE.db

# 保留最近7天
find $BACKUP_DIR -name "chat-*.db" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/chat-$DATE.db"
```

---

## 十、常见问题与解决方案

### 10.1 SSE连接问题

**问题**: SSE连接失败或频繁断开
**原因**:
- Nginx未正确配置
- 防火墙阻止
- 代理服务器缓冲

**解决方案**:
```nginx
# 必须配置
proxy_buffering off;
proxy_set_header Connection '';
proxy_set_header Cache-Control no-cache;
```

### 10.2 数据库锁定

**问题**: "database is locked" 错误
**原因**: SQLite不支持并发写入

**解决方案**:
- 确保数据库操作串行化
- 使用事务
- 考虑连接池

### 10.3 文件上传失败

**问题**: 上传大文件失败
**原因**:
- Nginx `client_max_body_size` 限制
- Express `express.json()` 限制

**解决方案**:
```javascript
// server/src/app.ts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### 10.4 跨域问题

**问题**: 前端无法访问后端API
**原因**: CORS配置不当

**解决方案**:
```javascript
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
```

---

## 十一、性能优化建议

### 11.1 前端优化
- ✅ 使用React.memo优化组件
- ✅ 懒加载组件
- ✅ 虚拟化长列表
- ✅ 优化图片和静态资源

### 11.2 后端优化
- ✅ 数据库索引优化
- ✅ 启用HTTP压缩
- ✅ 请求限流
- ✅ 缓存静态数据

### 11.3 SSE优化
- ✅ 及时清理断开的连接
- ✅ 心跳检测
- ✅ 连接数限制
- ✅ 消息批量推送

---

## 十二、安全考虑

### 12.1 输入验证
- ✅ 房间号格式验证
- ✅ 消息长度限制
- ✅ 文件类型和大小限制

### 12.2 文件上传安全
- ✅ 文件名随机化
- ✅ 文件类型白名单
- ✅ 病毒扫描（可选）

### 12.3 API安全
- ✅ CORS限制
- ✅ 请求频率限制
- ✅ 敏感信息过滤

---

## 十三、版本信息

**文档版本**: v2.0
**最后更新**: 2025-12-30
**项目版本**: v1.0.0
**维护者**: Web Chat System Team

---

## 附录

### A. 快速参考

#### API速查表
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/rooms/public` | GET | 获取公共大厅 |
| `/api/rooms/create` | POST | 创建房间 |
| `/api/rooms/join/:code` | GET | 加入房间 |
| `/api/messages/send` | POST | 发送消息 |
| `/api/messages/:roomId/latest` | GET | 获取历史消息 |
| `/api/sse/:roomId` | GET | SSE连接 |
| `/api/sse/stats` | GET | 连接统计 |
| `/api/files/upload` | POST | 上传文件 |

#### 数据库表
- `users` - 用户信息
- `rooms` - 房间信息
- `user_status` - 用户在线状态
- `messages` - 聊天消息

#### SSE事件类型
- `connected` - 连接确认
- `newMessage` - 新消息推送
- `userStatus` - 用户状态变化
- `error` - 错误事件

### B. 开发工具推荐
- **VSCode** + TypeScript插件
- **Postman** / **Insomnia** - API测试
- **SQLite Browser** - 数据库查看
- **浏览器开发者工具** - 调试SSE

### C. 参考文档
- [React官方文档](https://react.dev)
- [Express官方文档](https://expressjs.com)
- [SQLite文档](https://www.sqlite.org/docs.html)
- [SSE MDN文档](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
