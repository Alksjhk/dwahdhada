# 轻量级网页聊天系统 - 部署指南

## 🚀 快速部署

### 环境要求
- **Node.js**: 18.0.0 或更高版本
- **Bun**: 1.0+ (推荐)
- **操作系统**: Windows/Linux/macOS

> **注意**: 本项目使用 Bun 作为包管理器，也支持 npm/yarn

### 两种部署模式

#### 模式1: 开发环境 (前后端分离)
- 前端端口: 5173
- 后端端口: 3001
- Vite代理API请求到后端
- 支持热重载

#### 模式2: 生产环境 (合并部署 - 推荐)
- 单端口: 3001
- Express提供前后端服务
- 相对路径API调用
- 无需额外配置

## 📦 详细部署步骤

### 1. 获取项目代码
```bash
git clone https://github.com/your-username/web-chat-system.git
cd dwahdhada
```

### 2. 安装依赖
```bash
# 一键安装所有依赖（推荐）
bun run install:all

# 或分别安装
bun install          # 根目录
cd server && bun install
cd ../client && bun install
cd ..
```

### 3. 环境配置

#### 前端环境变量 (client/.env)
```env
# 开发环境
VITE_API_BASE_URL=http://localhost:3001
VITE_NODE_ENV=development

# 生产环境 (合并部署)
VITE_API_BASE_URL=
VITE_DEFAULT_API_URL=
VITE_API_TIMEOUT=15000
VITE_NODE_ENV=production
VITE_ENABLE_LOGGING=false
VITE_ENABLE_DEBUG=false
```

#### 后端环境变量 (server/.env)
```env
# 开发环境
PORT=3001
DATABASE_PATH=./database/chat.db
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 生产环境
PORT=3001
DATABASE_PATH=./database/chat.db
NODE_ENV=production
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://yourdomain.com
```

### 4. 启动服务

#### 开发环境 (前后端分离)
```bash
# 同时启动前后端
bun run dev

# 或分别启动
bun run server:dev  # 后端: http://localhost:3001
bun run client:dev  # 前端: http://localhost:5173
```

#### 生产环境 (合并部署 - 推荐)
```bash
# 方式1: 使用启动脚本 (最简单)
bun start.js

# 方式2: 手动构建并启动
cd client && bun run build
cd ../server && bun run merge

# 方式3: 使用npm脚本
cd server && bun run merge
```

**访问地址**: `http://localhost:3001`

## 🌐 生产环境部署

### 1. 构建优化
```bash
# 方式1: 使用启动脚本自动构建
bun start.js

# 方式2: 手动构建
cd client && bun run build
cd ../server && bun run merge
```

### 2. 使用 PM2 (推荐)

```bash
# 1. 构建前端
cd client && bun run build

# 2. 安装 PM2
npm install -g pm2

# 3. 启动应用
cd ../server
pm2 start src/app.js --name "chat-server"

# 4. 设置开机自启
pm2 startup
pm2 save

# 5. 查看状态
pm2 status
pm2 logs chat-server
```

### 3. 使用 Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖并构建
RUN bun install
RUN cd client && bun run build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["bun", "server/src/app.ts"]
```

```bash
# 构建镜像
docker build -t chat-system .

# 运行容器 (挂载数据卷)
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/server/database:/app/server/database \
  -v $(pwd)/server/uploads:/app/server/uploads \
  --name chat-app \
  chat-system
```

### 4. Nginx 反向代理 (可选)

**注意**: 合并部署后通常不需要Nginx，但如果需要SSL或负载均衡：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 合并部署模式 - 直接代理到后端
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE关键配置 - 禁用缓冲
        proxy_buffering off;
        proxy_set_header Connection '';
        proxy_set_header Cache-Control no-cache;
        proxy_set_header X-Accel-Buffering no;
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
```

**如果使用分离部署模式**:
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

        # SSE配置
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

## 🔧 配置选项

### 后端配置
| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| PORT | 3001 | 服务器端口 |
| DATABASE_PATH | ./database/chat.db | 数据库文件路径 |
| NODE_ENV | development | 运行环境 (development/production) |
| UPLOAD_DIR | ./uploads | 文件上传目录 |
| MAX_FILE_SIZE | 10485760 | 最大文件大小(10MB) |
| CORS_ORIGIN | - | 生产环境CORS域名(可选) |

### 前端配置
| 配置项 | 开发环境 | 生产环境 | 说明 |
|--------|----------|----------|------|
| VITE_API_BASE_URL | http://localhost:3001 | (空值) | API基础URL |
| VITE_API_TIMEOUT | 10000 | 15000 | 请求超时时间(毫秒) |
| VITE_NODE_ENV | development | production | 运行环境 |
| VITE_ENABLE_LOGGING | true | false | 是否启用日志 |
| VITE_ENABLE_DEBUG | true | false | 是否启用调试 |

**重要说明**:
- 生产环境 `VITE_API_BASE_URL=` 空值表示使用相对路径 `/api`
- 合并部署后，前端自动使用当前域名的相对路径

## 🛠️ 故障排除

### 常见问题

#### 1. 端口占用
```bash
# 查看端口占用
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Linux/macOS

# 杀死进程
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/macOS
```

#### 2. 前端构建文件不存在
**症状**: 合并部署后访问页面404

**解决方案**:
```bash
# 必须先构建前端
cd client && bun run build

# 检查dist目录是否存在
ls client/dist/index.html
```

#### 3. 数据库权限问题
```bash
# 确保数据库目录有写权限
chmod 755 server/database
chmod 644 server/database/chat.db
```

#### 4. 文件上传失败
```bash
# 确保上传目录存在且有写权限
mkdir -p server/uploads
chmod 755 server/uploads
```

#### 5. 依赖安装失败
```bash
# 清理缓存重新安装
cd client && rm -rf node_modules bun.lockb && bun install
cd ../server && rm -rf node_modules bun.lockb && bun install
```

#### 6. 合并部署后API请求失败
**症状**: 前端无法访问API，显示网络错误

**原因**: 环境变量配置错误

**解决方案**:
- 检查 `client/.env` 中 `VITE_API_BASE_URL=` 为空
- 确保前端使用相对路径 `/api`
- 验证后端 `server/src/app.ts` 正确配置静态文件服务

#### 7. SSE连接失败
**症状**: 消息无法实时推送，连接状态显示错误

**解决方案**:
- 检查 `server/src/app.ts` 中CORS配置
- 确保生产环境设置 `NODE_ENV=production`
- 测试SSE端点: `curl -N "http://localhost:3001/api/sse/0?userId=test"`
- 检查防火墙设置

#### 8. 页面加载但无法交互
**症状**: 页面显示但无法登录或发送消息

**原因**: API路径配置错误

**解决方案**:
- 浏览器开发者工具查看网络请求
- 确认API请求URL是否正确
- 检查后端日志确认请求是否到达

### 日志查看
```bash
# 开发环境日志
cd server && bun run dev

# PM2 日志
pm2 logs chat-server

# Docker 日志
docker logs <container-id>

# 实时监控SSE连接
curl http://localhost:3001/api/sse/stats

# 查看前端构建状态
ls -la client/dist/
```

## 📊 性能优化

### 1. 数据库优化
- 定期清理旧消息
- 添加适当索引
- 使用事务处理

### 2. SSE优化
- 及时清理断开的连接
- 限制每个房间的连接数
- 批量推送消息减少开销
- 监控SSE连接统计

### 3. 文件存储优化
- 使用CDN存储文件
- 图片压缩和格式转换
- 定期清理无用文件

### 4. 前端优化
- 启用Gzip压缩
- 使用CDN加速
- 代码分割和懒加载
- 优化React组件渲染

## 🔒 安全配置

### 1. 文件上传安全
- 限制文件类型
- 限制文件大小
- 文件名随机化
- 病毒扫描

### 2. API安全
- 请求频率限制
- 输入验证
- SQL注入防护
- XSS防护

### 3. 服务器安全
- 使用HTTPS
- 设置安全头
- 定期更新依赖
- 监控异常访问

## 📈 监控和维护

### 1. 系统监控
```bash
# 使用 PM2 监控
pm2 monit

# 系统资源监控
htop  # Linux
top   # macOS
```

### 2. 日志管理
```bash
# 日志轮转
pm2 install pm2-logrotate

# 日志分析
tail -f server/logs/app.log
```

### 3. 数据备份
```bash
# 数据库备份
cp server/database/chat.db backup/chat_$(date +%Y%m%d).db

# 文件备份
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz server/uploads/
```

## 🎯 部署检查清单

### 部署前检查
- [ ] Node.js 版本 >= 18.0.0
- [ ] Bun 版本 >= 1.0+
- [ ] 所有依赖安装完成 (`bun run install:all`)
- [ ] 环境变量配置正确
- [ ] 数据库目录权限正确
- [ ] 文件上传目录权限正确

### 开发环境验证
- [ ] `bun run dev` 启动成功
- [ ] 前端访问 http://localhost:5173 正常
- [ ] 后端API http://localhost:3001 正常
- [ ] Vite代理正常工作

### 生产环境 (合并部署) 验证
- [ ] 前端已构建 (`client/dist` 存在)
- [ ] `bun start.js` 或 `bun run merge` 启动成功
- [ ] 单端口访问 http://localhost:3001 正常
- [ ] 前端页面加载正常
- [ ] API接口 `/api/*` 响应正常
- [ ] SSE连接正常（查看连接状态指示器）
- [ ] 文件上传功能正常
- [ ] 消息收发功能正常（实时推送）
- [ ] 房间切换功能正常

### 生产环境部署检查
- [ ] 使用 PM2 或 Docker 部署
- [ ] 环境变量 `NODE_ENV=production`
- [ ] CORS配置正确（如需要）
- [ ] 防火墙配置（允许3001端口）
- [ ] 数据库备份策略
- [ ] 文件上传目录备份
- [ ] 日志管理配置

### 合并部署特有检查
- [ ] `client/.env` 中 `VITE_API_BASE_URL=` 为空
- [ ] `server/src/app.ts` 静态文件服务配置正确
- [ ] `server/src/app.ts` SPA路由配置正确
- [ ] 前端构建文件完整 (`dist/index.html` 存在)

---

**部署指南版本**: v1.1 (合并部署版)
**适用系统版本**: v1.1.0+
**最后更新**: 2025-12-31

如有部署问题，请参考项目文档或提交Issue。