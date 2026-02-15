
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface CompletionOptions {
    messages: ChatMessage[];
    stream?: boolean;
}

export const streamCompletion = async (options: CompletionOptions) => {
    const runtimeConfig = useRuntimeConfig();
    const apiKey = runtimeConfig.generativeAi.apiToken;
    const model = runtimeConfig.generativeAi.model || 'gemini-2.5-flash-lite';

    if (!apiKey) {
        throw new Error('Missing Generative AI API Token');
    }

    // Convert messages to Gemini format
    let systemInstruction = undefined;
    const contents = [];

    for (const msg of options.messages) {
        if (msg.role === 'system') {
            systemInstruction = {
                parts: [{ text: msg.content }]
            };
        } else if (msg.role === 'user') {
            contents.push({
                role: 'user',
                parts: [{ text: msg.content }]
            });
        } else if (msg.role === 'assistant') {
            contents.push({
                role: 'model',
                parts: [{ text: msg.content }]
            });
        }
    }

    const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents,
            systemInstruction,
        }),
    });

    if (!response.ok) {
        throw new Error(`LLM API Error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
        throw new Error('LLM API returned no body');
    }

    return response.body as ReadableStream;
};
