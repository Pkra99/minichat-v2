import { useI18n } from '../i18n';

export function TypingIndicator() {
    const { t } = useI18n();

    return (
        <div className="typing-indicator">
            <div className="typing-avatar">🤖</div>
            <div className="typing-content">
                <div className="typing-bubble">
                    <span className="typing-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                    </span>
                    <span className="typing-text">{t.typingIndicator}</span>
                </div>
            </div>
        </div>
    );
}
