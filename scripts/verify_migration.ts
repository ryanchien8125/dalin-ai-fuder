
import pg from 'pg';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from root
dotenv.config({ path: resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
}

console.log('Connecting to:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password

const pool = new pg.Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function main() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Connection successful! Database time:', res.rows[0]);

        console.log('Checking tables...');
        const tablesRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN ('chat_conversations', 'chat_messages');
        `);
        
        console.log('Found tables:', tablesRes.rows.map(r => r.table_name));

        if (tablesRes.rows.length === 2) {
            console.log('All required tables exist.');
        } else {
            console.log('Some tables are missing. Running initDb logic...');
            // We can manually run the CREATE statements here to be sure, or rely on the app.
            // Let's create them here to help the user as requested "also create tables for me".
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
            
            await pool.query(createConversations);
            await pool.query(createMessages);
            console.log('Tables created successfully.');
        }

    } catch (e) {
        console.error('Verification failed:', e);
    } finally {
        await pool.end();
    }
}

main();
