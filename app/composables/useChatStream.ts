
import { ref } from 'vue';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: number;
}

export const useChatStream = () => {
    const messages = ref<ChatMessage[]>([]);
    const isLoading = ref(false);
    const conversationId = ref<string | null>(null);

    const sendMessage = async (content: string, lotNumber?: number) => {
        isLoading.value = true;
        
        // Optimistic UI update
        messages.value.push({
            role: 'user',
            content: content,
            createdAt: Date.now()
        });

        let currentAssistantMessage = '';
        const assistantMessageIndex = messages.value.length;
        
        // Placeholder for assistant message
        messages.value.push({
            role: 'assistant',
            content: '',
            createdAt: Date.now()
        });

        try {
            const response = await fetch('/api/v1/chat/completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId: conversationId.value,
                    content,
                    lotNumber
                }),
            });

            if (!response.ok) {
                let errorMessage = '連線錯誤，請稍後再試';
                try {
                    const errorData = await response.json();
                    // Nuxt createError structure: { statusCode, statusMessage, data: { message: ... } }
                    if (errorData.data?.message) {
                        errorMessage = errorData.data.message;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // Ignore JSON parse error, use default message
                }

                if (response.status === 429 || response.status === 403) {
                    // Limits exceeded
                    if (errorMessage === '連線錯誤，請稍後再試') {
                         errorMessage = '請求過於頻繁或已達上限，請稍後再試。';
                    }
                } else if (response.status === 400) {
                    errorMessage = '請求無效，請重新操作。';
                }

                throw new Error(errorMessage);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No reader available');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            
                            if (data.type === 'init') {
                                conversationId.value = data.conversationId;
                            } else if (data.type === 'content') {
                                currentAssistantMessage += data.content;
                                if (messages.value[assistantMessageIndex]) {
                                    messages.value[assistantMessageIndex].content = currentAssistantMessage;
                                }
                            } else if (data.type === 'error') {
                                console.error('Stream error:', data.message);
                                const msg = data.message || '連線錯誤，請稍後再試';
                                // Replace loading placeholder with error message
                                if (messages.value[assistantMessageIndex]) {
                                    messages.value[assistantMessageIndex].content = `[系統提示] ${msg}`;
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Chat error:', error);
            const msg = error instanceof Error ? error.message : '連線錯誤，請稍後再試';
            if (messages.value[assistantMessageIndex]) {
                messages.value[assistantMessageIndex].content = `[系統提示] ${msg}`;
            }
        } finally {
            isLoading.value = false;
        }
    };

    const loadHistory = async (id: string) => {
        if (!id) return;
        conversationId.value = id;
        try {
            const history = await $fetch<any[]>(`/api/v1/chat/conversation/${id}`);
            messages.value = history.map(msg => ({
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt
            }));
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    return {
        messages,
        isLoading,
        conversationId,
        sendMessage,
        loadHistory
    };
};
