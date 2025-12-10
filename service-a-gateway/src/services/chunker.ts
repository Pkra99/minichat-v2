// Text chunker for SSE streaming
// Splits a full response into smaller chunks for progressive delivery via SSE

export interface ChunkOptions {
    // Target size of each chunk in characters (used in chunk mode)
    chunkSize?: number;
    // Delay between chunks/words in milliseconds
    delayMs?: number;
    // Streaming mode: 'word' for typewriter effect, 'chunk' for size-based
    mode?: 'word' | 'chunk';
}

const DEFAULT_CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '50', 10);
const DEFAULT_DELAY_MS = parseInt(process.env.CHUNK_DELAY_MS || '100', 10);

// Split text into words for typewriter effect
// Preserves whitespace and punctuation
export function* createWords(text: string): Generator<string> {
    // Split by word boundaries but keep whitespace attached
    const tokens = text.match(/\S+\s*/g) || [text];

    for (const token of tokens) {
        yield token;
    }
}

// Split text into chunks for streaming (size-based)
// Tries to break at word boundaries when possible
export function* createChunks(
    text: string,
    options: ChunkOptions = {}
): Generator<string> {
    const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;

    if (text.length <= chunkSize) {
        yield text;
        return;
    }

    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= chunkSize) {
            yield remaining;
            break;
        }

        // Try to find a good break point (word boundary)
        let breakPoint = chunkSize;

        // Look for a space near the chunk boundary
        const spaceIndex = remaining.lastIndexOf(' ', chunkSize);
        if (spaceIndex > chunkSize * 0.5) {
            breakPoint = spaceIndex + 1;
        }

        // Also check for newlines which are natural break points
        const newlineIndex = remaining.lastIndexOf('\n', chunkSize);
        if (newlineIndex > breakPoint * 0.7) {
            breakPoint = newlineIndex + 1;
        }

        const chunk = remaining.substring(0, breakPoint);
        yield chunk;

        remaining = remaining.substring(breakPoint);
    }
}

// Create an async generator that yields words with delays (typewriter effect)
export async function* createDelayedWords(
    text: string,
    delayMs?: number
): AsyncGenerator<string> {
    const delay = delayMs ?? DEFAULT_DELAY_MS;
    const words = Array.from(createWords(text));

    for (let i = 0; i < words.length; i++) {
        yield words[i];

        // Don't delay after the last word
        if (i < words.length - 1) {
            await sleep(delay);
        }
    }
}

// Create an async generator that yields chunks with delays
export async function* createDelayedChunks(
    text: string,
    options: ChunkOptions = {}
): AsyncGenerator<string> {
    const delayMs = options.delayMs || DEFAULT_DELAY_MS;
    const mode = options.mode || 'word'; // Default to word-by-word

    if (mode === 'word') {
        // Typewriter effect - word by word
        yield* createDelayedWords(text, delayMs);
    } else {
        // Chunk mode - size based
        const chunks = Array.from(createChunks(text, options));

        for (let i = 0; i < chunks.length; i++) {
            yield chunks[i];

            if (i < chunks.length - 1) {
                await sleep(delayMs);
            }
        }
    }
}

// Helper to sleep for a given number of milliseconds
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Get chunk/word statistics for a text
export function getChunkStats(text: string, mode: 'word' | 'chunk' = 'word', chunkSize?: number): {
    totalLength: number;
    chunkCount: number;
    avgChunkSize: number;
} {
    const items = mode === 'word'
        ? Array.from(createWords(text))
        : Array.from(createChunks(text, { chunkSize }));

    const totalLength = text.length;
    const chunkCount = items.length;

    return {
        totalLength,
        chunkCount,
        avgChunkSize: chunkCount > 0 ? Math.round(totalLength / chunkCount) : 0,
    };
}
