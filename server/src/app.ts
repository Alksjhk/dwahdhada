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
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // Vite和CRA默认端口
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 提供上传的文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: '接口不存在' });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('服务器错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
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
            console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
            console.log(`📊 数据库路径: ${dbPath}`);
            console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

startServer();