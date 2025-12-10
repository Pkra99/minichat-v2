import { useState } from 'react';
import { useI18n } from '../i18n';

interface DebugCornerProps {
    tenantId: string;
    messageCount: number;
    engine?: string;
    isConnected?: boolean;
}

export function DebugCorner({ tenantId, messageCount, engine, isConnected = true }: DebugCornerProps) {
    const { t } = useI18n();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`debug-corner ${isExpanded ? 'expanded' : ''}`}>
            <button
                className="debug-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                title={t.debugTitle}
            >
                <span className="debug-icon">🔧</span>
                <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            </button>

            {isExpanded && (
                <div className="debug-panel">
                    <h4>{t.debugTitle}</h4>
                    <div className="debug-row">
                        <span className="debug-label">{t.tenantLabel}:</span>
                        <code className="debug-value">{tenantId}</code>
                    </div>
                    <div className="debug-row">
                        <span className="debug-label">{t.messagesLabel}:</span>
                        <span className="debug-value">{messageCount}</span>
                    </div>
                    {engine && (
                        <div className="debug-row">
                            <span className="debug-label">{t.engineLabel}:</span>
                            <span className="debug-value">{engine}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
