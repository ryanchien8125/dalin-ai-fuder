import { v4 as uuidv4 } from 'uuid';
import { getDb } from '~~/server/utils/db';
import { 
  runFuderBot, 
  extractFortuneStickNumber, 
  getFuderFortuneStick,
  type RunFuderBotOptions
} from '~~/server/utils/completion_fuder';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const db = getDb();

    // 1. Get or Create Conversation ID
    let conversationId = body.conversationId;
    if (!conversationId) {
        conversationId = uuidv4();
        await db.query('INSERT INTO chat_conversations (id, created_at, updated_at) VALUES ($1, $2, $3)', [conversationId, Date.now(), Date.now()]);
    }

    // 2. Save User Message
    const userMessageId = uuidv4();
    const userContent = body.content || '';
    const lotNumber = body.lotNumber;
    
    // 1.5 Check Conversation Limits
    const CONVERSATION_TIME_LIMIT_MINUTES = 20;
    const CONVERSATION_MESSAGE_LIMIT = 20;

    const statsRes = await db.query(`
        SELECT 
            COUNT(*) as count,
            MIN(created_at) as first_message_time
        FROM chat_messages 
        WHERE conversation_id = $1
    `, [conversationId]);
    
    const stats = statsRes.rows[0];
    const messageCount = parseInt(stats?.count || '0');
    const firstMessageTime = stats?.first_message_time ? parseInt(stats.first_message_time) : null;

    // Check message count
    if (messageCount >= CONVERSATION_MESSAGE_LIMIT) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Conversation Limit Exceeded',
            data: {
                error: 'CONVERSATION_LIMIT_EXCEEDED',
                reason: 'message_count',
                message: '此次解籤對話已達訊息上限，無法繼續追問。'
            }
        });
    }

    // Check time limit
    if (firstMessageTime) {
        const diffMinutes = (Date.now() - firstMessageTime) / (1000 * 60);
        if (diffMinutes >= CONVERSATION_TIME_LIMIT_MINUTES) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Conversation Limit Exceeded',
                data: {
                    error: 'CONVERSATION_LIMIT_EXCEEDED',
                    reason: 'time',
                    message: '此次解籤對話已封存，無法繼續追問。'
                }
            });
        }
    }

    let finalUserContent = userContent;
    // if (stats.count === 0 && lotNumber) {
    //     finalUserContent = `我是一位信眾，抽到了第 ${lotNumber} 籤，問題是：「${userContent}」`;
    // }

    await db.query('INSERT INTO chat_messages (id, conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5)', [userMessageId, conversationId, 'user', finalUserContent, Date.now()]);

    // 3. Fuder Logic: Check/Lock Stick & Prepare Context
    // 判斷是否鎖定籤號 (Metadata check via Title)
    let fortuneData = null;
    try {
        const res = await db.query('SELECT title FROM chat_conversations WHERE id = $1', [conversationId]);
        const row = res.rows[0];
        
        if (row && row.title && row.title.startsWith('Fuder Stick ')) {
            const stickNum = parseInt(row.title.replace('Fuder Stick ', ''));
            fortuneData = getFuderFortuneStick(stickNum);
        } else if (lotNumber) {
             const stickNum = typeof lotNumber === 'string' ? parseInt(lotNumber) : lotNumber;
             fortuneData = getFuderFortuneStick(stickNum);
             if (fortuneData) {
                 try {
                    await db.query('UPDATE chat_conversations SET title = $1 WHERE id = $2', [`Fuder Stick ${stickNum}`, conversationId]);
                } catch (e) {
                    console.error('[Fuder API] Lock Stick Error:', e);
                }
             }
        }
    } catch (e) {
        console.error('[Fuder API] Metadata Check Error:', e);
    }

    // 如果未鎖定，嘗試提取意圖
    if (!fortuneData) {
        const intent = await extractFortuneStickNumber(finalUserContent);
        if (intent.action === 'QUERY_STICK' && intent.number) {
            fortuneData = getFuderFortuneStick(intent.number);
            if (fortuneData) {
                try {
                    await db.query('UPDATE chat_conversations SET title = $1 WHERE id = $2', [`Fuder Stick ${intent.number}`, conversationId]);
                } catch (e) {
                    console.error('[Fuder API] Lock Stick Error:', e);
                }
            }
        } else if (intent.action === 'DRAW_STICK') {
            const randomNum = Math.floor(Math.random() * 60) + 1;
            fortuneData = getFuderFortuneStick(randomNum);
            if (fortuneData) {
                try {
                    await db.query('UPDATE chat_conversations SET title = $1 WHERE id = $2', [`Fuder Stick ${randomNum}`, conversationId]);
                } catch (e) {
                    console.error('[Fuder API] Lock Stick Error:', e);
                }
            }
        }
    }

    // 3.5 Retrieve History
    const historyRes = await db.query('SELECT role, content FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conversationId]);
    const dbHistory = historyRes.rows as { role: 'user' | 'assistant' | 'system', content: string }[];
    
    // Convert to Gemini Message format for runFuderBot
    const geminiHistory = dbHistory.reduce((acc: any[], msg) => {
        let role = '';
        if (msg.role === 'assistant') role = 'model';
        else if (msg.role === 'user') role = 'user';
        
        if (role) {
            acc.push({ role, parts: [{ text: msg.content }] });
        }
        return acc;
    }, []);

    // 4. Call Fuder Bot & Stream
    // Set headers for SSE
    setHeader(event, 'Content-Type', 'text/event-stream');
    setHeader(event, 'Cache-Control', 'no-cache');
    setHeader(event, 'Connection', 'keep-alive');
    
    const assistantMessageId = uuidv4();
    let fullAssistantResponse = '';

    return new ReadableStream({
        async start(controller) {
            // Send conversation ID first
            const initPayload = JSON.stringify({ type: 'init', conversationId });
            controller.enqueue(new TextEncoder().encode(`data: ${initPayload}\n\n`));

            // Adapter for runFuderBot eventStream
            const eventStreamAdapter = {
                push: async (data: any) => {
                    // data from runFuderBot is { event: 'data', data: stringified_json_content, ... }
                    // Content format: { content: "text" } inside the stringified data
                    if (data.event === 'data' && data.data) {
                        try {
                            const parsed = JSON.parse(data.data);
                            if (parsed.content) {
                                fullAssistantResponse += parsed.content;
                                const payload = JSON.stringify({ 
                                    type: 'content', 
                                    content: parsed.content, 
                                    messageId: assistantMessageId 
                                });
                                controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
                            }
                        } catch (e) {
                            console.error('Error parsing Fuder chunk:', e);
                        }
                    }
                }
            };

            try {
                const responseText = await runFuderBot({
                    userMessageContent: finalUserContent,
                    history: geminiHistory,
                    fortuneData,
                    eventStream: eventStreamAdapter
                });

                // Fallback if stream was empty or just to ensure we have full text
                if (!fullAssistantResponse && responseText) {
                     fullAssistantResponse = responseText;
                }
                
                // Save Assistant Message to DB
                if (fullAssistantResponse) {
                    await db.query('INSERT INTO chat_messages (id, conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5)', [assistantMessageId, conversationId, 'assistant', fullAssistantResponse, Date.now()]);
                }

                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            } catch (err: any) {
                console.error('Fuder Bot Error:', err);
                let message = '目前系統繁忙，請稍後再試。';
                let code = 500;

                if (err.statusCode === 429) {
                    message = '請求過於頻繁或已達上限，請稍後再試。';
                    code = 429;
                } else if (err.statusCode === 400) {
                    message = '請求無效，請重新操作。';
                    code = 400;
                }

                const errorPayload = JSON.stringify({ type: 'error', message, code });
                controller.enqueue(new TextEncoder().encode(`data: ${errorPayload}\n\n`));
            } finally {
                controller.close();
            }
        }
    });

});
