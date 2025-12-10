import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useI18n } from '../i18n';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatWindowProps {
    tenantId: string;
    apiUrl: string;
    slowMode?: boolean;
    onEngineChange?: (engine: string) => void;
    onMessageCountChange?: (count: number) => void;
}

export function ChatWindow({
    tenantId,
    apiUrl,
    slowMode = false,
    onEngineChange,
    onMessageCountChange
}: ChatWindowProps) {
    const { t } = useI18n();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent, scrollToBottom]);

    // Load chat history from backend on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/v2/debug/state`, {
                    headers: { 'X-Tenant-Id': tenantId },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.messages && data.messages.length > 0) {
                        setMessages(data.messages);
                        console.log(`[ChatWindow] Loaded ${data.messages.length} messages for tenant: ${tenantId}`);
                    }
                }
            } catch (error) {
                console.error('[ChatWindow] Failed to load history:', error);
            }
        };

        loadHistory();
    }, [apiUrl, tenantId]);

    // Update message count
    useEffect(() => {
        onMessageCountChange?.(messages.length);
    }, [messages.length, onMessageCountChange]);

    // Generate unique ID
    const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Handle sending message
    const handleSend = async () => {
        const message = inputValue.trim();
        if (!message || isStreaming) return;

        // Add user message
        const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsStreaming(true);
        setStreamingContent('');

        try {
            // Create SSE connection
            const url = new URL(`${apiUrl}/api/v2/chat/stream`);
            url.searchParams.set('msg', message);
            if (slowMode) {
                url.searchParams.set('mode', 'slow');
            }

            const eventSource = new EventSource(url.toString());

            // Create a promise to handle tenant header via fetch first
            // EventSource doesn't support custom headers, so we use a workaround
            // Actually, we need to pass tenant as query param for EventSource
            eventSource.close();

            // Use fetch with custom headers for SSE
            const response = await fetch(url.toString(), {
                headers: {
                    'X-Tenant-Id': tenantId,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value, { stream: true });
                    const lines = text.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            try {
                                const parsed = JSON.parse(data);

                                // Check if it's a chunk or done event
                                if (typeof parsed === 'string') {
                                    fullContent += parsed;
                                    setStreamingContent(fullContent);
                                } else if (parsed.engine) {
                                    // Done event
                                    onEngineChange?.(parsed.engine);
                                }
                            } catch {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            }

            // Add assistant message
            if (fullContent) {
                const assistantMessage: Message = {
                    id: generateId(),
                    role: 'assistant',
                    content: fullContent,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: t.errorMessage,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsStreaming(false);
            setStreamingContent('');
            inputRef.current?.focus();
        }
    };

    // Handle enter key
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-window">
            <div className="messages-container">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <span className="welcome-icon">💬</span>
                        <p>{t.welcomeMessage}</p>
                    </div>
                )}

                {messages.map(msg => (
                    <MessageItem
                        key={msg.id}
                        id={msg.id}
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                    />
                ))}

                {isStreaming && streamingContent && (
                    <MessageItem
                        id="streaming"
                        role="assistant"
                        content={streamingContent}
                        isStreaming={true}
                    />
                )}

                {isStreaming && !streamingContent && (
                    <TypingIndicator />
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
                <input
                    ref={inputRef}
                    type="text"
                    className="message-input"
                    placeholder={t.inputPlaceholder}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isStreaming}
                />
                <button
                    className="send-button"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isStreaming}
                >
                    <span className="send-icon">➤</span>
                    <span className="send-text">{t.sendButton}</span>
                </button>
            </div>
        </div>
    );
}
