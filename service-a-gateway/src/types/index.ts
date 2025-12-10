// Optional metadata that can be attached to messages
// This is extensible - add any fields needed in the future
export interface MessageMetadata {
    tags?: string[];
    confidence?: number;
    source?: string;
    [key: string]: unknown; // Allow additional custom fields
}

// Message types for the chat system
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    // Optional metadata field for extensibility (backward-compatible)
    // Existing code that doesn't use metadata continues to work
    metadata?: MessageMetadata;
}

// Tenant conversation history
// Extensible structure for per-tenant settings
export interface TenantHistory {
    tenantId: string;
    messages: Message[];
    createdAt: string;
    lastActivityAt: string;
    // Optional settings for future expansion (e.g., default language, provider)
    settings?: TenantSettings;
}

// Per-tenant settings (optional, for future expansion)
export interface TenantSettings {
    defaultLanguage?: string;
    defaultProvider?: string;
    [key: string]: unknown;
}

// Request body for POST /api/v2/chat
export interface ChatRequest {
    message: string;
    metadata?: MessageMetadata;
}

// Response from Service B
export interface ResponderResponse {
    reply: string;
    engine: string;
    timestamp: string;
}

// SSE event types
export type SSEEvent =
    | { event: 'chunk'; data: string }
    | { event: 'done'; data: Record<string, unknown> };
