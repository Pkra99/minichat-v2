import type { ChatEngine } from './ChatEngine.js';

// RuleBasedEngine - keyword matching with fallback responses
// Functional implementation of ChatEngine interface

interface Rule {
    keywords: string[];
    responses: string[];
    priority?: number;
}

const rules: Rule[] = [
    {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'howdy', 'hola'],
        responses: [
            'Hello there! How can I help you today?',
            'Hi! Great to see you!',
            'Hey! What\'s on your mind?',
        ],
        priority: 1,
    },
    {
        keywords: ['bye', 'goodbye', 'see you', 'later', 'farewell'],
        responses: [
            'Goodbye! Have a wonderful day!',
            'See you later! Take care!',
            'Farewell! Until next time!',
        ],
        priority: 1,
    },
    {
        keywords: ['help', 'assist', 'support', 'guide'],
        responses: [
            'I\'m here to help! What do you need assistance with?',
            'Need help? Just ask me anything!',
        ],
        priority: 2,
    },
    {
        keywords: ['thanks', 'thank you', 'appreciate', 'grateful'],
        responses: [
            'You\'re welcome! Happy to help!',
            'My pleasure! Anything else?',
        ],
        priority: 1,
    },
    {
        keywords: ['joke', 'funny', 'laugh', 'humor'],
        responses: [
            'Why don\'t scientists trust atoms? Because they make up everything!',
            'What do you call a fake noodle? An impasta!',
            'Why did the scarecrow win an award? He was outstanding in his field!',
        ],
        priority: 2,
    },
    {
        keywords: ['time', 'date', 'today', 'now'],
        responses: [
            `The current server time is ${new Date().toLocaleString()}`,
            `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        ],
        priority: 2,
    },
    {
        keywords: ['name', 'who are you', 'what are you', 'introduce'],
        responses: [
            'I\'m MiniChat\'s RuleBasedEngine! I match keywords to give you responses.',
            'I\'m a simple rule-based chatbot, part of the MiniChat v2 system!',
        ],
        priority: 3,
    },
];

const fallbackResponses = [
    'Interesting! Tell me more about that.',
    'I\'m not sure I understand, but I\'m listening!',
    'That\'s an intriguing topic. Could you elaborate?',
    'Fascinating! What else would you like to discuss?',
];

// Find matched keywords in message
function findMatchedKeywords(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const matched: string[] = [];

    for (const rule of rules) {
        for (const kw of rule.keywords) {
            if (lowerMessage.includes(kw)) matched.push(kw);
        }
    }

    return matched;
}

// Generate extended response for slow mode
function generateSlowResponse(original: string, baseReply: string, hadMatch: boolean): string {
    const matchedKeywords = findMatchedKeywords(original);

    return [
        baseReply,
        `\n\n**Message Analysis**`,
        `\n- Characters: ${original.length}`,
        `\n- Words: ${original.split(/\s+/).filter(Boolean).length}`,
        `\n- Rule matched: ${hadMatch ? 'Yes' : 'No (used fallback)'}`,
        `\n\n**Keywords Detected**`,
        `\n- ${matchedKeywords.length > 0 ? matchedKeywords.join(', ') : 'None from my ruleset'}`,
        `\n\nProcessed at: ${new Date().toISOString()}`,
        `\n\n---`,
        `\nThis extended response demonstrates the slow mode feature.`,
    ].join('');
}

// Pick random item from array
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Generate reply based on keyword matching
async function generateReply(message: string, mode?: 'slow' | 'fast'): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Find matching rules sorted by priority
    const matchingRules = rules
        .filter(rule => rule.keywords.some(kw => lowerMessage.includes(kw)))
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const hadMatch = matchingRules.length > 0;
    const baseReply = hadMatch
        ? pickRandom(matchingRules[0].responses)
        : pickRandom(fallbackResponses);

    if (mode === 'slow') {
        return generateSlowResponse(message, baseReply, hadMatch);
    }

    return baseReply;
}

// Export as ChatEngine-compatible object
export const ruleBasedEngine: ChatEngine = {
    name: 'RuleBasedEngine',
    generateReply,
};

// Legacy class export for backwards compatibility
export class RuleBasedEngine implements ChatEngine {
    readonly name = 'RuleBasedEngine';
    generateReply = generateReply;
}
