// ChatEngine Interface - contract for pluggable chat response generators

export interface ChatEngine {
    // Generate a reply to the user's message
    generateReply(message: string, mode?: 'slow' | 'fast'): Promise<string>;
    // Human-readable name of the engine
    readonly name: string;
}

// Request payload for /respond endpoint
export interface RespondRequest {
    message: string;
    tenantId: string;
    mode?: 'slow' | 'fast';
}

// Response payload from /respond endpoint
export interface RespondResponse {
    reply: string;
    engine: string;
    timestamp: string;
}
