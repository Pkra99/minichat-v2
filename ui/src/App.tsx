import { useState, useCallback } from 'react'
import { I18nProvider, useI18n } from './i18n'
import { ChatWindow, LanguageToggle, DebugCorner } from './components'
import './index.css'

// Generate a stable tenant ID for this session
const generateTenantId = () => {
  const stored = sessionStorage.getItem('minichat-tenant-id');
  if (stored) return stored;

  const newId = `tenant-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  sessionStorage.setItem('minichat-tenant-id', newId);
  return newId;
};

const TENANT_ID = generateTenantId();
// In Docker, nginx proxies /api/* to the gateway, so we use relative URL
// In dev, we default to localhost:3000
const API_URL = import.meta.env.VITE_API_URL || '';

function AppContent() {
  const { t } = useI18n();
  const [slowMode, setSlowMode] = useState(false);
  const [engine, setEngine] = useState<string>('');
  const [messageCount, setMessageCount] = useState(0);

  const handleEngineChange = useCallback((newEngine: string) => {
    setEngine(newEngine);
  }, []);

  const handleMessageCountChange = useCallback((count: number) => {
    setMessageCount(count);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>{t.appTitle}</h1>
          <span className="version">v2</span>
        </div>

        <div className="header-actions">
          <button
            className={`mode-toggle ${slowMode ? 'active' : ''}`}
            onClick={() => setSlowMode(!slowMode)}
            title={slowMode ? t.fastMode : t.slowMode}
          >
            <span className="mode-icon">{slowMode ? '🐢' : '🚀'}</span>
            <span>{slowMode ? t.slowMode : t.fastMode}</span>
          </button>

          <LanguageToggle />
        </div>
      </header>

      <ChatWindow
        tenantId={TENANT_ID}
        apiUrl={API_URL}
        slowMode={slowMode}
        onEngineChange={handleEngineChange}
        onMessageCountChange={handleMessageCountChange}
      />

      <DebugCorner
        tenantId={TENANT_ID}
        messageCount={messageCount}
        engine={engine}
        isConnected={true}
      />
    </div>
  );
}

function App() {
  return (
    <I18nProvider defaultLanguage="en">
      <AppContent />
    </I18nProvider>
  );
}

export default App
