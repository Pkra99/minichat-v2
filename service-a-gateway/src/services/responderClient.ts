import { ResponderResponse } from '../types/index.js';

// HTTP client for Service B (Responder)
// Functional module pattern - no class

const baseUrl = process.env.RESPONDER_URL || 'http://localhost:3001';

// Send a message to Service B and get a response
export async function getResponse(
    message: string,
    tenantId: string,
    mode?: 'slow' | 'fast'
): Promise<ResponderResponse> {
    const url = `${baseUrl}/respond`;

    console.log(`[ResponderClient] Calling ${url} for tenant: ${tenantId}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, tenantId, mode }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Responder error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as ResponderResponse;
        console.log(`[ResponderClient] Received response from ${data.engine} (${data.reply.length} chars)`);

        return data;
    } catch (error) {
        console.error('[ResponderClient] Error calling responder:', error);

        return {
            reply: 'Sorry, I\'m having trouble connecting to the response service. Please try again later.',
            engine: 'fallback',
            timestamp: new Date().toISOString(),
        };
    }
}

// Health check for Service B
export async function healthCheck(): Promise<boolean> {
    try {
        const response = await fetch(`${baseUrl}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

// Named export object for backwards compatibility
export const responderClient = { getResponse, healthCheck };
