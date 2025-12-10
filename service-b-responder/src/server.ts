import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
    ChatEngine,
    EchoEngine,
    RuleBasedEngine,
    RespondRequest,
    RespondResponse
} from './engines/index.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const ENGINE_TYPE = process.env.ENGINE || 'echo';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Initialize the selected engine
function createEngine(): ChatEngine {
    switch (ENGINE_TYPE.toLowerCase()) {
        case 'rulebased':
        case 'rule-based':
        case 'rule':
            console.log('🧠 Using RuleBasedEngine');
            return new RuleBasedEngine();
        case 'echo':
        default:
            console.log('🔊 Using EchoEngine');
            return new EchoEngine();
    }
}

const engine = createEngine();


app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        engine: engine.name,
        timestamp: new Date().toISOString()
    });
});


app.post('/respond', async (req: Request, res: Response) => {
    try {
        const { message, tenantId, mode } = req.body as RespondRequest;

        // Validate request
        if (!message || typeof message !== 'string') {
            res.status(400).json({
                error: 'Missing or invalid "message" field'
            });
            return;
        }

        if (!tenantId || typeof tenantId !== 'string') {
            res.status(400).json({
                error: 'Missing or invalid "tenantId" field'
            });
            return;
        }

        console.log(`[Tenant: ${tenantId}] Processing message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);

        // Generate reply using the engine
        const reply = await engine.generateReply(message, mode);

        const response: RespondResponse = {
            reply,
            engine: engine.name,
            timestamp: new Date().toISOString(),
        };

        console.log(`[Tenant: ${tenantId}] Reply generated (${reply.length} chars)`);

        res.json(response);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


app.get('/info', (_req: Request, res: Response) => {
    res.json({
        service: 'service-b-responder',
        version: '1.0.0',
        engine: engine.name,
        availableEngines: ['EchoEngine', 'RuleBasedEngine'],
        endpoints: {
            'POST /respond': 'Generate a response to a message',
            'GET /health': 'Health check',
            'GET /info': 'Service information',
        },
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════╗');
    console.log('║    Service B - Responder              ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║    Port: ${PORT}                      ║`);
    console.log(`║    Engine: ${engine.name.padEnd(20)}  ║`);
    console.log('╚═══════════════════════════════════════╝');
    console.log('');
    console.log('Ready to receive requests!');
});

export default app;
