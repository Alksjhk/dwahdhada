import sqlite3 from 'sqlite3';
import path from 'path';

export function initializeDatabase(dbPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // 确保数据库目录存在
        const dbDir = path.dirname(dbPath);
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('数据库连接成功:', dbPath);
        });

        // 串行执行数据库操作
        db.serialize(() => {
            // 创建用户表
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error('创建用户表失败:', err);
                else console.log('用户表创建成功');
            });

            // 创建房间表
            db.run(`
                CREATE TABLE IF NOT EXISTS rooms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_code CHAR(6) UNIQUE NOT NULL,
                    room_name TEXT DEFAULT '私密房间',
                    created_by TEXT,
                    admin_users TEXT DEFAULT '[]',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_public BOOLEAN DEFAULT 0
                )
            `, (err) => {
                if (err) console.error('创建房间表失败:', err);
                else console.log('房间表创建成功');
            });

            // 创建用户在线状态表
            db.run(`
                CREATE TABLE IF NOT EXISTS user_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    room_id INTEGER,
                    is_online BOOLEAN DEFAULT 1,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (room_id) REFERENCES rooms(id)
                )
            `, (err) => {
                if (err) console.error('创建用户状态表失败:', err);
                else console.log('用户状态表创建成功');
            });

            // 创建消息表
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
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
                )
            `, (err) => {
                if (err) console.error('创建消息表失败:', err);
                else console.log('消息表创建成功');
            });

            // 创建索引
            db.run(`CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`);

            // 创建公共大厅（如果不存在）
            db.run(`
                INSERT OR IGNORE INTO rooms (room_code, room_name, is_public)
                VALUES ('PUBLIC', '公共大厅', 1)
            `, (err) => {
                if (err) {
                    console.error('创建公共大厅失败:', err);
                } else {
                    console.log('公共大厅初始化完成');
                }
                
                db.close((closeErr) => {
                    if (closeErr) {
                        reject(closeErr);
                    } else {
                        console.log('数据库初始化完成');
                        resolve();
                    }
                });
            });
        });
    });
}