import { getDatabase } from '../utils/database';

export async function initializeDatabase(): Promise<void> {
    const db = getDatabase();

    try {
        // 创建用户表
        await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('用户表创建成功');

        // 创建房间表
        await db.run(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                room_code CHAR(6) UNIQUE NOT NULL,
                room_name TEXT DEFAULT '私密房间',
                created_by TEXT,
                admin_users TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_public BOOLEAN DEFAULT FALSE
            )
        `);
        console.log('房间表创建成功');

        // 创建用户在线状态表
        await db.run(`
            CREATE TABLE IF NOT EXISTS user_status (
                id SERIAL PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL,
                room_id INTEGER,
                is_online BOOLEAN DEFAULT TRUE,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES rooms(id)
            )
        `);
        console.log('用户状态表创建成功');

        // 创建消息表
        await db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                room_id INTEGER NOT NULL,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                message_type TEXT DEFAULT 'text',
                file_name TEXT,
                file_size INTEGER,
                file_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES rooms(id)
            )
        `);
        console.log('消息表创建成功');

        // 创建索引
        await db.run(`CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`);
        console.log('索引创建成功');

        // 创建公共大厅（如果不存在）
        const existingPublicRoom = await db.get(
            'SELECT id FROM rooms WHERE room_code = $1',
            ['PUBLIC']
        );
        if (!existingPublicRoom) {
            await db.run(`
                INSERT INTO rooms (room_code, room_name, is_public)
                VALUES ('PUBLIC', '公共大厅', TRUE)
            `);
            console.log('公共大厅初始化完成');
        }

        console.log('数据库初始化完成');
    } catch (err) {
        console.error('数据库初始化失败:', err);
        throw err;
    }
}
