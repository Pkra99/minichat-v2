import { Request, Response, NextFunction } from 'express';

 // Extended Request type with tenant information
export interface TenantRequest extends Request {
    tenantId: string;
}

// Middleware to extract and validate X-Tenant-Id header
export function tenantMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
        res.status(400).json({
            error: 'Missing X-Tenant-Id header',
            message: 'All requests must include a valid X-Tenant-Id header',
        });
        return;
    }

    if (typeof tenantId !== 'string') {
        res.status(400).json({
            error: 'Invalid X-Tenant-Id header',
            message: 'X-Tenant-Id must be a single string value',
        });
        return;
    }

    if (tenantId.length < 1 || tenantId.length > 128) {
        res.status(400).json({
            error: 'Invalid X-Tenant-Id header',
            message: 'X-Tenant-Id must be between 1 and 128 characters',
        });
        return;
    }

    // Attach tenantId to request
    (req as TenantRequest).tenantId = tenantId;

    // Log tenant activity
    console.log(`[Tenant: ${tenantId}] ${req.method} ${req.path}`);

    next();
}

// Helper to get tenant ID from request
export function getTenantId(req: Request): string {
    return (req as TenantRequest).tenantId;
}
