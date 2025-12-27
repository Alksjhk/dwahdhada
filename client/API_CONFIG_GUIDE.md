# API 配置指南

## 概述
前端项目已完全使用环境变量控制所有后端API设置，不再有任何硬编码的API地址。

## 环境变量配置

### 主要环境变量

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | 主要API基础URL | `http://localhost:3001` | `https://api.yourdomain.com` |
| `VITE_DEFAULT_API_URL` | 备用API URL | `http://localhost:3001` | `https://backup-api.yourdomain.com` |
| `VITE_API_TIMEOUT` | API请求超时时间(ms) | `10000` | `15000` |
| `VITE_NODE_ENV` | 环境类型 | `development` | `production` |
| `VITE_ENABLE_LOGGING` | 启用API日志 | `true` | `false` |
| `VITE_ENABLE_DEBUG` | 启用调试模式 | `true` | `false` |

## 快速设置

### 1. 使用环境设置脚本（推荐）

```bash
# 开发环境
node scripts/setup-env.js development

# 测试环境  
node scripts/setup-env.js test

# 预发布环境
node scripts/setup-env.js staging

# 生产环境
node scripts/setup-env.js production
```

### 2. 手动创建 .env 文件

复制 `.env.example` 文件为 `.env` 并修改配置：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件中的配置。

### 3. 使用自定义API地址

可以通过环境变量覆盖默认配置：

```bash
# 开发环境使用自定义API地址
DEV_API_URL=http://192.168.1.100:3001 node scripts/setup-env.js development

# 生产环境使用自定义API地址
PROD_API_URL=https://my-api.example.com node scripts/setup-env.js production
```

## 不同环境配置示例

### 开发环境 (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_DEFAULT_API_URL=http://localhost:3001
VITE_API_TIMEOUT=10000
VITE_NODE_ENV=development
VITE_ENABLE_LOGGING=true
VITE_ENABLE_DEBUG=true
```

### 生产环境 (.env.production)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_DEFAULT_API_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=15000
VITE_NODE_ENV=production
VITE_ENABLE_LOGGING=false
VITE_ENABLE_DEBUG=false
```

## 部署注意事项

1. **不要提交 .env 文件到版本控制**
   - `.env` 文件已在 `.gitignore` 中被忽略
   - 只提交 `.env.example` 作为模板

2. **CI/CD 部署**
   ```bash
   # 在部署脚本中设置环境变量
   export PROD_API_URL=https://your-production-api.com
   node scripts/setup-env.js production
   npm run build
   ```

3. **Docker 部署**
   ```dockerfile
   # 在 Dockerfile 中设置环境变量
   ENV VITE_API_BASE_URL=https://api.yourdomain.com
   ENV VITE_NODE_ENV=production
   ```

## 验证配置

启动开发服务器后，可以在浏览器控制台中检查配置：

```javascript
// 查看当前API配置
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Environment:', import.meta.env.VITE_NODE_ENV);
```

## 故障排除

### 1. API请求失败
- 检查 `VITE_API_BASE_URL` 是否正确
- 确认后端服务是否运行在指定地址
- 检查网络连接和防火墙设置

### 2. 环境变量不生效
- 确保变量名以 `VITE_` 开头
- 重启开发服务器
- 检查 `.env` 文件格式是否正确

### 3. 代理配置问题
- 开发环境下，Vite会自动代理 `/api` 请求到配置的后端地址
- 生产环境需要确保前端和后端部署在正确的域名下