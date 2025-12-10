import type { ChatEngine } from './ChatEngine.js';

// EchoEngine - echoes input with random transformations
// Functional implementation of ChatEngine interface

const transformations = [
    (text: string) => `Echo: "${text}"`,
    (text: string) => `You said: ${text.toUpperCase()}`,
    (text: string) => `Reversed: ${text.split('').reverse().join('')}`,
    (text: string) => `Sparkle: * ${text} *`,
    (text: string) => `Whisper: *${text.toLowerCase()}*`,
];

// Generate extended response for slow mode
function generateSlowResponse(original: string, transformed: string): string {
    return [
        transformed,
        `\n\nOriginal message had ${original.length} characters.`,
        `\nWord count: ${original.split(/\s+/).filter(Boolean).length}`,
        `\nProcessed at: ${new Date().toISOString()}`,
        `\n\nFun fact: If you reverse "${original}", you get "${original.split('').reverse().join('')}"!`,
        `\n\nRandom number for you: ${Math.floor(Math.random() * 1000)}`,
        `\n\nThe EchoEngine appreciates your message!`,
        `\n\nThis is a longer response designed to demonstrate the chunking feature.`,
        ` The gateway service will split this into multiple SSE events.`,
    ].join('');
}

// Generate reply with random transformation
async function generateReply(message: string, mode?: 'slow' | 'fast'): Promise<string> {
    const transform = transformations[Math.floor(Math.random() * transformations.length)];
    const baseReply = transform(message);

    if (mode === 'slow') {
        return generateSlowResponse(message, baseReply);
    }

    return baseReply;
}

// Export as ChatEngine-compatible object
export const echoEngine: ChatEngine = {
    name: 'EchoEngine',
    generateReply,
};

// Legacy class export for backwards compatibility
export class EchoEngine implements ChatEngine {
    readonly name = 'EchoEngine';
    generateReply = generateReply;
}
