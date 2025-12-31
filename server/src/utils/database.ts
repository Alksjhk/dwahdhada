import { Pool, QueryResult } from 'pg';

class Database {
    private pool: Pool;

    constructor() {
        // 解析 POSTGRES_URL 连接字符串
        const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

        let poolConfig: any = {
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: { rejectUnauthorized: false }
        };

        if (postgresUrl) {
            // 解析连接字符串 postgres://user:pass@host:5432/db?sslmode=require
            const url = new URL(postgresUrl);
            poolConfig = {
                ...poolConfig,
                host: url.hostname,
                port: parseInt(url.port || '5432'),
                database: url.pathname.slice(1), // 移除开头的 /
                user: url.username,
                password: url.password,
            };
        } else {
            // 使用独立的环境变量
            poolConfig = {
                ...poolConfig,
                host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
                database: process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'chat_db',
                user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '',
            };
        }

        this.pool = new Pool(poolConfig);

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    // 查询单条记录
    async get(sql: string, params: any[] = []): Promise<any> {
        const result: QueryResult = await this.pool.query(sql, params);
        return result.rows[0] || null;
    }

    // 查询多条记录
    async all(sql: string, params: any[] = []): Promise<any[]> {
        const result: QueryResult = await this.pool.query(sql, params);
        return result.rows;
    }

    // 执行插入/更新/删除
    async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
        const result: QueryResult = await this.pool.query(sql, params);
        // PostgreSQL 使用 RETURNING 返回插入的ID
        if (result.rows.length > 0 && result.rows[0].id) {
            return { lastID: result.rows[0].id, changes: result.rowCount || 0 };
        }
        return { lastID: 0, changes: result.rowCount || 0 };
    }

    // 关闭连接池
    async close(): Promise<void> {
        await this.pool.end();
    }

    // 获取连接池实例
    getPool(): Pool {
        return this.pool;
    }
}

// 单例模式
let dbInstance: Database | null = null;

export function getDatabase(): Database {
    if (!dbInstance) {
        dbInstance = new Database();
    }
    return dbInstance;
}

export default getDatabase();
