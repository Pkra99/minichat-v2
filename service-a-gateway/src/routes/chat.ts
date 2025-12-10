import { Router, Request, Response } from 'express';
import { getTenantId } from '../middleware/tenant.js';
import { tenantStore } from '../store/tenantStore.js';
import { responderClient } from '../services/responderClient.js';
import { createDelayedChunks, getChunkStats } from '../services/chunker.js';
import { ChatRequest } from '../types/index.js';

const router = Router();

// POST /api/v2/chat
// Accept a message and store it (immediate acknowledgment)
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const tenantId = getTenantId(req);
        const { message } = req.body as ChatRequest;

        if (!message || typeof message !== 'string') {
            res.status(400).json({
                error: 'Missing or invalid "message" field',
            });
            return;
        }

        if (message.length > 4096) {
            res.status(400).json({
                error: 'Message too long',
                message: 'Message must be 4096 characters or less',
            });
            return;
        }

        // Store the user message
        tenantStore.addMessage(tenantId, 'user', message);

        // Return immediate acknowledgment
        res.status(202).json({
            accepted: true,
            message: 'Message received. Use /api/v2/chat/stream to get the response.',
        });
    } catch (error) {
        console.error('Error in POST /chat:', error);
        res.status(500).json({
            error: 'Internal server error',
        });
    }
});

// GET /api/v2/chat/stream
// SSE endpoint for streaming responses
router.get('/chat/stream', async (req: Request, res: Response) => {
    const tenantId = getTenantId(req);
    const message = req.query.msg as string;
    const mode = req.query.mode as 'slow' | 'fast' | undefined;

    if (!message || typeof message !== 'string') {
        res.status(400).json({
            error: 'Missing or invalid "msg" query parameter',
        });
        return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        // Store the user message
        tenantStore.addMessage(tenantId, 'user', message);

        // Get response from Service B
        const responderResponse = await responderClient.getResponse(
            message,
            tenantId,
            mode
        );

        const fullReply = responderResponse.reply;
        const stats = getChunkStats(fullReply, 'word');

        console.log(`[SSE] Streaming ${stats.chunkCount} words for tenant: ${tenantId}`);

        // Stream word-by-word for typewriter effect
        // Slow mode = 100ms per word, fast mode = 30ms per word
        const delayMs = mode === 'slow' ? 100 : 30;
        for await (const word of createDelayedChunks(fullReply, { delayMs, mode: 'word' })) {
            res.write(`event: chunk\ndata: ${JSON.stringify(word)}\n\n`);
        }

        // Store the complete assistant message
        tenantStore.addMessage(tenantId, 'assistant', fullReply);

        // Send done event
        res.write(`event: done\ndata: ${JSON.stringify({
            engine: responderResponse.engine,
            totalLength: fullReply.length,
            chunkCount: stats.chunkCount,
        })}\n\n`);

        res.end();
    } catch (error) {
        console.error('Error in SSE stream:', error);

        // Send error event
        res.write(`event: error\ndata: ${JSON.stringify({
            error: 'Stream error',
            message: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`);

        res.end();
    }
});

// GET /api/v2/debug/state
// Get tenant history and debug information
router.get('/debug/state', (req: Request, res: Response) => {
    const tenantId = getTenantId(req);

    const history = tenantStore.getHistory(tenantId);
    const stats = tenantStore.getStats();

    res.json({
        tenant: {
            id: tenantId,
            messageCount: history.messages.length,
            createdAt: history.createdAt,
            lastActivityAt: history.lastActivityAt,
        },
        messages: history.messages,
        globalStats: stats,
    });
});

// DELETE /api/v2/debug/state
// Clear tenant history
router.delete('/debug/state', (req: Request, res: Response) => {
    const tenantId = getTenantId(req);

    const cleared = tenantStore.clearHistory(tenantId);

    res.json({
        success: true,
        cleared,
        tenantId,
    });
});

export default router;
