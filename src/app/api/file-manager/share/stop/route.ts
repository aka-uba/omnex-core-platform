import { NextRequest, NextResponse } from 'next/server';
import { updateServerStatus, stopHttpServer } from '../status/route';
export async function POST(request: NextRequest) {
    try {
        // Stop the HTTP server
        stopHttpServer();
        
        // Update server status
        updateServerStatus({
            isRunning: false,
            url: null,
            port: null,
            folderId: null,
        });

        return NextResponse.json({
            success: true,
            message: 'Server stopped successfully',
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to stop server' },
            { status: 500 }
        );
    }
}

