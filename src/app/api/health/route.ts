/**
 * Health Check Endpoint
 * Basic health check for monitoring
 */

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.8',
        service: 'omnex-core-platform',
    });
}
