interface MessageItemProps {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    isStreaming?: boolean;
}

export function MessageItem({ role, content, timestamp, isStreaming }: MessageItemProps) {
    const isUser = role === 'user';

    return (
        <div
            className={`message-item ${isUser ? 'message-user' : 'message-assistant'} ${isStreaming ? 'streaming' : ''}`}
        >
            <div className="message-avatar">
                {isUser ? '👤' : '🤖'}
            </div>
            <div className="message-content">
                <div className="message-bubble">
                    <p>{content}{isStreaming && <span className="cursor-blink">▊</span>}</p>
                </div>
                {timestamp && (
                    <div className="message-timestamp">
                        {new Date(timestamp).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
}
