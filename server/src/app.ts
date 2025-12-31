import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import roomRoutes from './routes/roomRoutes';
import messageRoutes from './routes/messageRoutes';
import fileRoutes from './routes/fileRoutes';
import sseRoutes from './routes/sseRoutes';
import { initializeDatabase } from './database/init';
import { migrateDatabase } from './database/migrate';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
// 根据环境配置CORS
const isProduction = process.env.NODE_ENV === 'production';

// 从环境变量读取CORS域名配置，支持多个域名用逗号分隔
function getCorsOrigins(): string[] {
    if (isProduction) {
        // 生产环境：从环境变量读取，或使用默认配置
        const corsEnv = process.env.CORS_ORIGIN;
        if (corsEnv) {
            return corsEnv.split(',').map(origin => origin.trim());
        }
        // 默认生产环境域名（需要根据实际情况修改）
        return ['https://yourdomain.com', 'https://www.yourdomain.com'];
    } else {
        // 开发环境
        return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
    }
}

const corsOptions = {
    origin: getCorsOrigins(),
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 提供上传的文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 静态文件服务 - 提供前端构建文件
const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));

// 请求日志中间件 - 生产环境只记录错误和重要请求
app.use((req, res, next) => {
    if (!isProduction) {
        // 开发环境：详细日志
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// 路由
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/sse', sseRoutes);

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA路由处理 - 在API路由之后，404处理之前
app.get('*', (req, res) => {
    // 如果请求的是API路径但不存在，返回404
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, message: '接口不存在' });
        return;
    }

    // 其他所有请求都返回index.html（SPA路由由前端处理）
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).json({ success: false, message: '页面不存在' });
        }
    });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isProduction) {
        // 生产环境：记录错误但不暴露详细信息
        console.error(`[${new Date().toISOString()}] 错误:`, {
            method: req.method,
            path: req.path,
            error: err.message
        });
        res.status(500).json({ success: false, message: '服务器内部错误' });
    } else {
        // 开发环境：详细错误信息
        console.error('服务器错误:', err);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: err.message,
            stack: err.stack
        });
    }
});

// 初始化数据库并启动服务器
async function startServer() {
    try {
        const dbPath = process.env.DATABASE_PATH || './database/chat.db';
        
        // 确保数据库目录存在
        const dbDir = path.dirname(dbPath);
        const fs = await import('fs');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            console.log('创建数据库目录:', dbDir);
        }

        await initializeDatabase(dbPath);
        
        // 运行数据库迁移
        await migrateDatabase(dbPath);
        
        app.listen(PORT, () => {
            if (isProduction) {
                console.log(`🚀 生产服务器启动成功 - 端口: ${PORT}`);
                console.log(`📊 数据库: ${dbPath}`);
                console.log(`🌍 环境: production`);
            } else {
                console.log(`🚀 开发服务器运行在 http://localhost:${PORT}`);
                console.log(`📊 数据库路径: ${dbPath}`);
                console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
            }
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

startServer();