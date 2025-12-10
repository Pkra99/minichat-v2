import { Message, MessageMetadata, TenantHistory } from '../types/index.js';
import { randomUUID } from 'crypto';

// In-memory store for tenant conversation history
// Functional module pattern - no class

// Private state
const store = new Map<string, TenantHistory>();

// Get or create history for a tenant
export function getHistory(tenantId: string): TenantHistory {
    let history = store.get(tenantId);

    if (!history) {
        history = {
            tenantId,
            messages: [],
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
        };
        store.set(tenantId, history);
        console.log(`[TenantStore] Created new history for tenant: ${tenantId}`);
    }

    return history;
}

// Add a message to tenant's history
// metadata is optional for backward compatibility
export function addMessage(
    tenantId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: MessageMetadata
): Message {
    const history = getHistory(tenantId);

    const message: Message = {
        id: randomUUID(),
        role,
        content,
        timestamp: new Date().toISOString(),
        ...(metadata && { metadata }), // Only include if provided
    };

    history.messages.push(message);
    history.lastActivityAt = message.timestamp;

    console.log(`[TenantStore] Added ${role} message for tenant: ${tenantId} (total: ${history.messages.length})`);

    return message;
}

// Get all messages for a tenant
export function getMessages(tenantId: string): Message[] {
    return getHistory(tenantId).messages;
}

// Clear history for a tenant
export function clearHistory(tenantId: string): boolean {
    const existed = store.has(tenantId);
    store.delete(tenantId);

    if (existed) {
        console.log(`[TenantStore] Cleared history for tenant: ${tenantId}`);
    }

    return existed;
}

// Get all tenant IDs
export function getAllTenantIds(): string[] {
    return Array.from(store.keys());
}

// Get store statistics
export function getStats(): { tenantCount: number; totalMessages: number } {
    let totalMessages = 0;
    for (const history of store.values()) {
        totalMessages += history.messages.length;
    }

    return {
        tenantCount: store.size,
        totalMessages,
    };
}

// Named export object for backwards compatibility
export const tenantStore = {
    getHistory,
    addMessage,
    getMessages,
    clearHistory,
    getAllTenantIds,
    getStats,
};
