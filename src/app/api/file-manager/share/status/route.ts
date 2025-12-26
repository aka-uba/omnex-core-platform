import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
// In-memory server status (in production, use database or Redis)
let serverStatus = {
    isRunning: false,
    url: null as string | null,
    port: null as number | null,
    folderId: null as string | null,
};

let serverProcess: ChildProcess | null = null;
let serverPid: number | null = null;

export async function GET(request: NextRequest) {
    try {
        // Tenant control
        const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
        const tenant = await getTenantFromRequest(request);
        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant context is required' },
                { 
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            );
        }

        // CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 200, headers });
        }

        // Check if process is actually running
        if (serverStatus.isRunning && serverProcess) {
            // Verify process is still alive
            if (serverProcess.killed || (serverProcess.exitCode !== null && serverProcess.exitCode !== undefined)) {
                // Process is dead, update status
                serverProcess = null;
                updateServerStatus({
                    isRunning: false,
                    url: null,
                    port: null,
                    folderId: null,
                });
            }
        } else if (serverStatus.isRunning && !serverProcess) {
            // Status says running but no process - fix inconsistency
            updateServerStatus({
                isRunning: false,
                url: null,
                port: null,
                folderId: null,
            });
        }
        
        return NextResponse.json(serverStatus, { headers });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to get server status' },
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            }
        );
    }
}

// Export function to update server status (for use in other routes)
export function updateServerStatus(status: typeof serverStatus) {
    serverStatus = { ...status };
}

export function getServerStatus() {
    return serverStatus;
}

// Start HTTP server
export async function startHttpServer(port: number, folderId: string | null, nextJsUrl?: string) {
    // Check if server process exists and is still alive
    if (serverProcess) {
        // Check if process is still running
        try {
            // On Windows, killed property might not be reliable, so check exitCode
            if (serverProcess.killed || (serverProcess.exitCode !== null && serverProcess.exitCode !== undefined)) {
                // Process is dead, clean it up
                serverProcess = null;
            } else {
                // Process is still running
                throw new Error('Server is already running');
            }
        } catch (error) {
            // If error is not about process being alive, rethrow
            if (error instanceof Error && error.message === 'Server is already running') {
                throw error;
            }
            // Otherwise, assume process is dead and continue
            serverProcess = null;
        }
    }

    return new Promise<void>((resolve, reject) => {
        try {
            const scriptPath = path.join(process.cwd(), 'scripts', 'start-share-server.js');
            
            // Check if script file exists
            if (!fs.existsSync(scriptPath)) {
                reject(new Error(`Script file not found: ${scriptPath}`));
                return;
            }
            
            const nodePath = process.execPath;
            
            // On Windows, use detached mode to keep process alive
            // On Unix, keep attached for better control
            const isWindows = process.platform === 'win32';
            
            // Get Next.js URL for the share server
            const nextJsUrlToUse = (() => {
                const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
                const host = process.env.NEXT_PUBLIC_HOST || 'localhost:3000';
                return `${protocol}://${host}`;
            })();
            
            serverProcess = spawn(nodePath, [scriptPath], {
                env: {
                    ...process.env,
                    SHARE_SERVER_PORT: port.toString(),
                    FOLDER_ID: folderId || '',
                    SHARE_PATH: folderId || '',
                    NEXT_JS_URL: nextJsUrlToUse,
                },
                stdio: ['ignore', 'pipe', 'pipe'], // Always use pipe to detect server start
                shell: false, // Don't use shell - direct execution is more reliable
                cwd: process.cwd(), // Set working directory
                detached: isWindows, // On Windows, detach to keep process alive independently
                windowsHide: true, // Hide console window on Windows
            });
            
            if (serverProcess.pid) {
                serverPid = serverProcess.pid;
            }
            
            // Keep process reference to prevent garbage collection
            // Process is attached, so we can track it properly

            let hasResolved = false;

            // Listen to stdout/stderr for both Windows and Unix
            serverProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                // Check for both "Server started" and "SERVER_STARTED" messages
                if ((output.includes('Server started') || output.includes('SERVER_STARTED') || output.includes('listening')) && !hasResolved) {
                    hasResolved = true;
                    // On Windows, unref the process AFTER we've confirmed it started
                    if (isWindows && serverProcess) {
                        serverProcess.unref();
                    }
                    resolve();
                }
            });

            serverProcess.stderr?.on('data', (data) => {
                const error = data.toString();
                console.error('[Share Server] stderr:', error);
                if (error.includes('EADDRINUSE') && !hasResolved) {
                    hasResolved = true;
                    reject(new Error(`Port ${port} is already in use`));
                }
            });

            serverProcess.on('error', (error) => {
                if (!hasResolved) {
                    hasResolved = true;
                    serverProcess = null;
                    reject(error);
                }
            });

            serverProcess.on('exit', (code, signal) => {
                // If process exits before we've resolved, it's an error
                if (!hasResolved) {
                    hasResolved = true;
                    serverProcess = null;
                    reject(new Error(`Server process exited with code ${code} before starting (signal: ${signal})`));
                } else {
                    // Process exited after we resolved - update status
                    serverProcess = null;
                    updateServerStatus({
                        isRunning: false,
                        url: null,
                        port: null,
                        folderId: null,
                    });
                }
            });

            // Timeout fallback - check if process is still running
            const timeout = 10000; // 10 seconds should be enough for server to start
            setTimeout(() => {
                if (!hasResolved) {
                    // Check if process is still alive
                    if (serverProcess && !serverProcess.killed && serverProcess.exitCode === null) {
                        // Process is still running, assume it started successfully
                        hasResolved = true;
                        // On Windows, unref the process AFTER we've confirmed it started
                        if (isWindows && serverProcess) {
                            serverProcess.unref();
                        }
                        resolve();
                    } else {
                        // Process is dead or killed
                        console.error('[Share Server] Process is not running (timeout reached)');
                        hasResolved = true;
                        serverProcess = null;
                        reject(new Error('Server process failed to start (timeout - process not running)'));
                    }
                }
            }, timeout);
        } catch (error) {
            reject(error);
        }
    });
}

// Stop HTTP server
export function stopHttpServer() {
    if (serverProcess) {
        try {
            const isWindows = process.platform === 'win32';
            
            if (isWindows && serverPid) {
                // On Windows, use taskkill for detached processes
                try {
                    exec(`taskkill /PID ${serverPid} /F /T`, (error) => {
                        if (error) {
                            console.error('[Share Server] Error stopping server:', error);
                        }
                        // Clear process reference
                        serverProcess = null;
                        serverPid = null;
                    });
                } catch (error) {
                    console.error('[Share Server] Error stopping server:', error);
                    serverProcess = null;
                    serverPid = null;
                }
            } else {
                // Try SIGTERM first (graceful shutdown)
                serverProcess.kill('SIGTERM');
                
                // If process doesn't exit within 2 seconds, force kill
                setTimeout(() => {
                    if (serverProcess && !serverProcess.killed) {
                        serverProcess.kill('SIGKILL');
                        serverProcess = null;
                    }
                }, 2000);
            }
        } catch (error) {
            // Error stopping server - continue anyway
        } finally {
            // Clear process reference after a delay
            setTimeout(() => {
                serverProcess = null;
                serverPid = null;
            }, 3000);
        }
    }
    
    // Update server status to reflect stopped state
    updateServerStatus({
        isRunning: false,
        url: null,
        port: null,
        folderId: null,
    });
}

