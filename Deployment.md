# 轻量级网页聊天系统 - 部署指南

## 🚀 快速部署

### 环境要求
- **Node.js**: 18.0.0 或更高版本
- **Bun**: 1.0+ (推荐)
- **操作系统**: Windows/Linux/macOS

> **注意**: 本项目使用 Bun 作为包管理器，也支持 npm/yarn

### 一键部署脚本

#### Windows (PowerShell)
```powershell
# 克隆项目
git clone https://github.com/your-username/web-chat-system.git
cd web-chat-system

# 安装所有依赖
bun run install:all

# 启动开发环境
bun run dev
```

#### Linux/macOS (Bash)
```bash
# 克隆项目
git clone https://github.com/your-username/web-chat-system.git
cd web-chat-system

# 安装所有依赖
bun run install:all

# 启动开发环境
bun run dev
```

## 📦 详细部署步骤

### 1. 获取项目代码
```bash
git clone https://github.com/your-username/web-chat-system.git
cd web-chat-system
```

### 2. 安装依赖
```bash
# 一键安装所有依赖（推荐）
bun run install:all

# 或分别安装
# 根目录依赖
bun install

# 后端依赖
cd server
bun install

# 前端依赖
cd ../client
bun install

# 返回根目录
cd ..
```

### 3. 环境配置

#### 后端环境变量 (server/.env)
```env
# 服务器端口
PORT=3001

# 数据库路径
DATABASE_PATH=./database/chat.db

# 运行环境
NODE_ENV=development

# 文件上传目录
UPLOAD_DIR=./uploads

# 文件大小限制 (字节)
MAX_FILE_SIZE=10485760
```

#### 前端配置 (client/vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

### 4. 启动服务

#### 开发环境
```bash
# 同时启动前后端 (推荐)
bun run dev

# 或分别启动
bun run server:dev  # 后端 (端口 3001)
bun run client:dev  # 前端 (端口 5173)
```

#### 生产环境
```bash
# 构建前端
bun run build

# 启动后端
bun start
```

## 🌐 生产环境部署

### 1. 构建优化
```bash
# 构建前端静态文件
cd client
bun run build

# 构建后端 (如果使用 TypeScript)
cd ../server
bun run build
```

### 2. 服务器配置

#### 使用 PM2 (推荐)
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server/dist/app.js --name "chat-server"

# 设置开机自启
pm2 startup
pm2 save
```

#### 使用 Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖
RUN bun install

# 构建前端
RUN bun run build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["bun", "start"]
```

```bash
# 构建镜像
docker build -t web-chat-system .

# 运行容器
docker run -p 3001:3001 -v $(pwd)/server/database:/app/server/database web-chat-system
```

### 3. Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理 (包含SSE支持)
    location /api/ {
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
| NODE_ENV | development | 运行环境 |
| UPLOAD_DIR | ./uploads | 文件上传目录 |
| MAX_FILE_SIZE | 10485760 | 最大文件大小(10MB) |

### 前端配置
| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| VITE_API_BASE_URL | /api | API基础路径 |
| VITE_API_TIMEOUT | 10000 | 请求超时时间(毫秒) |
| VITE_NODE_ENV | development | 运行环境 |

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

#### 2. 数据库权限问题
```bash
# 确保数据库目录有写权限
chmod 755 server/database
chmod 644 server/database/chat.db
```

#### 3. 文件上传失败
```bash
# 确保上传目录存在且有写权限
mkdir -p server/uploads
chmod 755 server/uploads
```

#### 4. 依赖安装失败
```bash
# 清理缓存重新安装
bun clean
rm -rf node_modules bun.lockb
bun install
```

#### 5. SSE连接失败
**症状**: 消息无法实时推送，连接状态显示错误

**解决方案**:
- 检查Nginx配置是否包含SSE禁用缓冲设置
- 验证防火墙是否阻止SSE连接
- 检查浏览器控制台是否有CORS错误
- 测试SSE端点: `curl -N "http://localhost:3001/api/sse/0?userId=test"`

#### 6. 消息延迟或丢失
**症状**: 消息发送后接收延迟或完全未收到

**解决方案**:
- 检查SSEManager连接状态
- 验证数据库插入是否成功
- 查看后端日志中的SSE广播记录
- 确认客户端是否正确订阅房间

### 日志查看
```bash
# 后端日志
cd server
bun run dev  # 开发环境日志

# PM2 日志
pm2 logs chat-server

# Docker 日志
docker logs <container-id>

# 实时监控SSE连接
curl http://localhost:3001/api/sse/stats
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
- [ ] 所有依赖安装完成
- [ ] 环境变量配置正确
- [ ] 数据库目录权限正确
- [ ] 文件上传目录权限正确

### 部署后验证
- [ ] 服务器启动成功
- [ ] 数据库连接正常
- [ ] API接口响应正常
- [ ] 前端页面加载正常
- [ ] SSE连接正常（查看连接状态指示器）
- [ ] 文件上传功能正常
- [ ] 消息收发功能正常（实时推送）
- [ ] 房间切换功能正常

### 生产环境检查
- [ ] HTTPS配置
- [ ] 反向代理配置（包含SSE支持）
- [ ] 防火墙配置（允许SSE连接）
- [ ] 监控系统配置（包括SSE连接监控）
- [ ] 备份策略配置
- [ ] 日志管理配置

---

**部署指南版本**: v1.0  
**适用系统版本**: v1.0.0  
**最后更新**: 2024年12月27日  

如有部署问题，请参考项目文档或提交Issue。