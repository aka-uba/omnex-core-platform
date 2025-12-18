import { NextRequest, NextResponse } from 'next/server';
import { updateServerStatus, startHttpServer, stopHttpServer } from '../status/route';
import { errorResponse } from '@/lib/api/response';
export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (error) {
            // If body is empty or invalid JSON, use empty object
            body = {};
        }
        const { folderId, path, expiresInHours } = body;
        
        // Use path if provided, otherwise use folderId
        const sharePath = path || folderId;

        // Check if server is already running (but also check actual process)

        // Get server IP and port
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host');
        if (!host) {
          return errorResponse('Bad Request', 'Host header is required', 400);
        }
        const sharePort = process.env.SHARE_SERVER_PORT || '1234';
        const localIp = process.env.LOCAL_IP || host.split(':')[0] || 'localhost';
        const nextJsPort = host.includes(':') ? host.split(':')[1] : '3000';
        const nextJsUrl = `${protocol}://${localIp}:${nextJsPort}`;
        
        // Try to start separate HTTP server, fallback to Next.js port
        let actualPort = parseInt(sharePort);
        let useNextJsPort = false;
        
        try {
            await startHttpServer(parseInt(sharePort), sharePath || null, nextJsUrl);
            actualPort = parseInt(sharePort);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // If error is "Server is already running", return 400
            if (errorMessage.includes('already running') || errorMessage.includes('EADDRINUSE')) {
                return NextResponse.json(
                    { 
                        error: 'Server is already running',
                        details: errorMessage
                    },
                    { status: 400 }
                );
            }
            
            // Fallback: use Next.js port instead
            useNextJsPort = true;
            actualPort = parseInt(nextJsPort || '3000');
        }
        
        // For Next.js, use root path (not locale-prefixed)
        // Public files are served directly from root
        const shareUrl = useNextJsPort
            ? `${protocol === 'https' ? 'https' : 'http'}://${localIp}:${nextJsPort}/share-files.html`
            : `${protocol === 'https' ? 'https' : 'http'}://${localIp}:${sharePort}/share-files.html`;

        // Update server status
        updateServerStatus({
            isRunning: true,
            url: shareUrl,
            port: actualPort,
            folderId: sharePath || null,
        });
        
        // Set auto-stop timer if expiresInHours is provided
        if (expiresInHours && expiresInHours > 0) {
            setTimeout(() => {
                stopHttpServer();
            }, expiresInHours * 60 * 60 * 1000);
        }

        return NextResponse.json({
            success: true,
            url: shareUrl,
            port: actualPort,
            folderId: folderId || null,
            message: useNextJsPort 
                ? `Share server is accessible via Next.js on port ${nextJsPort}. Access at: ${shareUrl}`
                : `Share server started on port ${sharePort}. Access at: ${shareUrl}`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { 
                error: 'Failed to start server',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}

