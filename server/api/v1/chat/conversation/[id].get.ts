
import { getDb } from '~~/server/utils/db';

export default defineEventHandler(async (event) => {
    const conversationId = event.context.params?.id;
    if (!conversationId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing Conversation ID',
        });
    }

    const db = getDb();
    const res = await db.query('SELECT role, content, created_at FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conversationId]);
    const messages = res.rows;

    // Filter out system messages if needed, or transform structure
    // Frontend expects specific format? Let's check existing implementation.
    // Existing mostly expects: { role, content }
    
    // Map to frontend friendly format
    const mappedMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at ? parseInt(msg.created_at) : Date.now()
    }));

    return mappedMessages;
});
