import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tenantMiddleware } from './middleware/tenant.js';
import chatRoutes from './routes/chat.js';
import { responderClient } from './services/responderClient.js';
import { tenantStore } from './store/tenantStore.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const RESPONDER_URL = process.env.RESPONDER_URL || 'http://localhost:3001';

const app = express();

// Global middleware
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    exposedHeaders: ['X-Tenant-Id'],
}));
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

app.get('/health', async (_req: Request, res: Response) => {
    const responderHealthy = await responderClient.healthCheck();
    const stats = tenantStore.getStats();

    res.json({
        status: 'healthy',
        service: 'service-a-gateway',
        responderStatus: responderHealthy ? 'connected' : 'disconnected',
        responderUrl: RESPONDER_URL,
        stats,
        timestamp: new Date().toISOString(),
    });
});

app.get('/info', (_req: Request, res: Response) => {
    res.json({
        service: 'service-a-gateway',
        version: '1.0.0',
        description: 'MiniChat v2 Gateway API with SSE streaming',
        endpoints: {
            'GET /health': 'Health check (no auth)',
            'GET /info': 'Service information (no auth)',
            'POST /api/v2/chat': 'Send a message (requires X-Tenant-Id)',
            'GET /api/v2/chat/stream': 'SSE stream response (requires X-Tenant-Id)',
            'GET /api/v2/debug/state': 'Get tenant history (requires X-Tenant-Id)',
            'DELETE /api/v2/debug/state': 'Clear tenant history (requires X-Tenant-Id)',
        },
        responderUrl: RESPONDER_URL,
    });
});

// Apply tenant middleware to /api routes
app.use('/api', tenantMiddleware);

// Mount chat routes
app.use('/api/v2', chatRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║    Service A - Gateway                        ║');
    console.log('╠═══════════════════════════════════════════════╣');
    console.log(`║    Port: ${PORT}                              ║`);
    console.log(`║    Responder: ${RESPONDER_URL           }     ║`);
    console.log('╠═══════════════════════════════════════════════╣');
    console.log('║    Endpoints:                                 ║');
    console.log('║    POST /api/v2/chat         - Send message   ║');
    console.log('║    GET  /api/v2/chat/stream  - SSE stream     ║');
    console.log('║    GET  /api/v2/debug/state  - Tenant debug   ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');
    console.log('Ready to receive requests!');
});

export default app;
