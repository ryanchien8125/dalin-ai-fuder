import pg from 'pg';
import { resolve } from 'path';

// Singleton instance
let _pool: pg.Pool | null = null;

export const getDb = () => {
    if (_pool) return _pool;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.warn('[DB] DATABASE_URL is not set, falling back to local SQLite might be needed but ignored for now as requested migration to PG.');
        // For development safety, maybe default to something or throw
        throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log(`[DB] Connecting to Postgres...`);
    
    _pool = new pg.Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });

    return _pool;
};

export const initDb = async () => {
    const pool = getDb();

    // Create tables if not exist
    // Note: Use BIGINT for timestamps to match previous INTEGER (ms) usage
    const createConversations = `
    CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        created_at BIGINT,
        updated_at BIGINT
    );
    `;

    const createMessages = `
    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        role TEXT,
        content TEXT,
        created_at BIGINT,
        FOREIGN KEY(conversation_id) REFERENCES chat_conversations(id)
    );
    `;

    try {
        await pool.query(createConversations);
        await pool.query(createMessages);
        console.log('[DB] Database tables initialized (PostgreSQL)');
    } catch (e) {
        console.error('[DB] Failed to initialize tables:', e);
    }
};

// Auto-init on import might be tricky with async, but let's try to call it.
// In Nuxt server environment, top-level await is supported in modules but utils are imported.
// We can just call it and let the promise float or handle it in a plugin if needed.
// For now, let's call it and catch errors.
initDb().catch(console.error);
