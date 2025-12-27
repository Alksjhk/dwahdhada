import sqlite3 from 'sqlite3';
import path from 'path';

export function migrateDatabase(dbPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('开始数据库迁移...');
        });

        db.serialize(() => {
            // 检查并添加消息表的新列
            db.all("PRAGMA table_info(messages)", (err, columns) => {
                if (err) {
                    console.error('获取表信息失败:', err);
                    return;
                }

                const columnNames = columns.map((col: any) => col.name);
                
                // 添加缺失的列
                const newColumns = [
                    { name: 'message_type', sql: 'ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT "text"' },
                    { name: 'file_name', sql: 'ALTER TABLE messages ADD COLUMN file_name TEXT' },
                    { name: 'file_size', sql: 'ALTER TABLE messages ADD COLUMN file_size INTEGER' },
                    { name: 'file_url', sql: 'ALTER TABLE messages ADD COLUMN file_url TEXT' }
                ];

                let pendingOperations = 0;
                let completedOperations = 0;

                newColumns.forEach(column => {
                    if (!columnNames.includes(column.name)) {
                        pendingOperations++;
                        db.run(column.sql, (err) => {
                            if (err) {
                                console.error(`添加列 ${column.name} 失败:`, err);
                            } else {
                                console.log(`添加列 ${column.name} 成功`);
                            }
                            completedOperations++;
                            if (completedOperations === pendingOperations) {
                                checkRoomsTable();
                            }
                        });
                    }
                });

                if (pendingOperations === 0) {
                    checkRoomsTable();
                }
            });

            function checkRoomsTable() {
                // 检查并添加房间表的新列
                db.all("PRAGMA table_info(rooms)", (err, columns) => {
                    if (err) {
                        console.error('获取房间表信息失败:', err);
                        return;
                    }

                    const columnNames = columns.map((col: any) => col.name);
                    
                    if (!columnNames.includes('admin_users')) {
                        db.run('ALTER TABLE rooms ADD COLUMN admin_users TEXT DEFAULT "[]"', (err) => {
                            if (err) {
                                console.error('添加 admin_users 列失败:', err);
                            } else {
                                console.log('添加 admin_users 列成功');
                            }
                            createUserStatusTable();
                        });
                    } else {
                        createUserStatusTable();
                    }
                });
            }

            function createUserStatusTable() {
                // 创建用户状态表（如果不存在）
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
                    if (err) {
                        console.error('创建用户状态表失败:', err);
                    } else {
                        console.log('用户状态表创建/检查完成');
                    }
                    
                    db.close((closeErr) => {
                        if (closeErr) {
                            reject(closeErr);
                        } else {
                            console.log('数据库迁移完成');
                            resolve();
                        }
                    });
                });
            }
        });
    });
}