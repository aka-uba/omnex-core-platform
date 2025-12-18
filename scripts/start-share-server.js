const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.SHARE_SERVER_PORT || 1234;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Store the server instance globally
let serverInstance = null;

function startShareServer(folderId = null) {
    if (serverInstance) {
        console.log('Server is already running');
        return serverInstance;
    }

    const server = http.createServer((req, res) => {
        console.log(`[Share Server] ${req.method} ${req.url}`);

        // CORS headers for all responses
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Health check endpoint - returns server running status
        if (req.url === '/health' || req.url === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', isRunning: true, port: PORT }));
            return;
        }

        // Serve share-files.html
        if (req.url === '/' || req.url === '/share-files.html') {
            const filePath = path.join(PUBLIC_DIR, 'share-files.html');
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error loading share-files.html');
                    return;
                }
                // Inject Next.js URL and share server status into HTML
                const nextJsUrl = process.env.NEXT_JS_URL || 'http://localhost:3000';
                const shareServerPort = PORT;
                const modifiedData = data.replace(
                    '</head>',
                    `<meta name="next-js-url" content="${nextJsUrl}">
                    <meta name="share-server-port" content="${shareServerPort}">
                    <script>
                        window.NEXT_JS_URL = "${nextJsUrl}";
                        window.SHARE_SERVER_PORT = ${shareServerPort};
                        window.SHARE_SERVER_RUNNING = true;
                    </script>
                    </head>`
                );
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(modifiedData);
            });
            return;
        }

        // API endpoint for files
        if (req.url === '/api/files' && req.method === 'GET') {
            // Proxy to Next.js API if available, otherwise return mock data
            const nextJsUrl = process.env.NEXT_JS_URL || 'http://localhost:3000';
            const proxyUrl = new URL(`${nextJsUrl}/api/file-manager/share/files`);

            console.log('[Share Server] Proxying files request to:', proxyUrl.href);

            // Use http or https based on URL
            const httpModule = proxyUrl.protocol === 'https:' ? require('https') : require('http');

            const proxyReq = httpModule.request(proxyUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Forward cookies if present
                    ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {}),
                },
            }, (proxyRes) => {
                let data = '';
                proxyRes.on('data', (chunk) => {
                    data += chunk;
                });
                proxyRes.on('end', () => {
                    console.log('[Share Server] Proxy response status:', proxyRes.statusCode);
                    res.writeHead(proxyRes.statusCode || 200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(data);
                });
            });

            proxyReq.on('error', (err) => {
                console.error('[Share Server] Proxy error:', err);
                // Fallback to empty array
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ success: true, files: [], error: err.message }));
            });

            proxyReq.end();
            return;
        }
        
        // API endpoint for file download
        if (req.url.startsWith('/api/download/') && req.method === 'GET') {
            const fileId = req.url.split('/api/download/')[1];
            // Proxy to Next.js API
            const nextJsUrl = process.env.NEXT_JS_URL || 'http://localhost:3000';
            const proxyUrl = `${nextJsUrl}/api/file-manager/share/download/${fileId}`;
            
            const http = require('http');
            const proxyReq = http.request(proxyUrl, (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 200, {
                    ...proxyRes.headers,
                    'Access-Control-Allow-Origin': '*'
                });
                proxyRes.pipe(res);
            });
            
            proxyReq.on('error', (err) => {
                console.error('[Share Server] Download proxy error:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Download failed');
            });
            
            proxyReq.end();
            return;
        }

        // 404 for other routes
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    });

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`[Share Server] Server started on port ${PORT}`);
        console.log(`[Share Server] Access at: http://localhost:${PORT}/share-files.html`);
        const localIp = process.env.LOCAL_IP || getLocalIp() || '192.168.1.77';
        console.log(`[Share Server] Network access: http://${localIp}:${PORT}/share-files.html`);
        // Signal parent process that server started
        if (process.stdout) {
            process.stdout.write('SERVER_STARTED\n');
            // Flush is not a standard method, use setImmediate instead
            setImmediate(() => {
                console.log('[Share Server] Server is ready and listening');
            });
        }
    });

    // Get local IP address
    function getLocalIp() {
        const os = require('os');
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                // Skip internal (127.x.x.x) and non-IPv4 addresses
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return null;
    }

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[Share Server] Port ${PORT} is already in use`);
            process.exit(1); // Exit on port conflict
        } else {
            console.error('[Share Server] Error:', err);
            process.exit(1); // Exit on other errors
        }
    });
    
    // Keep server reference to prevent garbage collection
    // This ensures the server stays alive
    if (!global.shareServerInstance) {
        global.shareServerInstance = server;
    }

    serverInstance = server;
    return server;
}

function stopShareServer() {
    if (serverInstance) {
        serverInstance.close(() => {
            console.log('[Share Server] Server stopped');
            serverInstance = null;
        });
    }
}

// If run directly, start the server
if (require.main === module) {
    const folderId = process.env.FOLDER_ID || null;
    const server = startShareServer(folderId);
    
    if (!server) {
        console.error('[Share Server] Failed to start server');
        process.exit(1);
    }
    
    // Keep process alive - prevent it from exiting
    // The server will keep the process alive, but we also need to handle signals
    
    // Graceful shutdown handlers
    process.on('SIGINT', () => {
        console.log('\n[Share Server] Received SIGINT, shutting down...');
        stopShareServer();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n[Share Server] Received SIGTERM, shutting down...');
        stopShareServer();
        process.exit(0);
    });
    
    // Handle uncaught exceptions to keep process alive
    process.on('uncaughtException', (error) => {
        console.error('[Share Server] Uncaught exception:', error);
        // Don't exit - keep server running if possible
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[Share Server] Unhandled rejection at:', promise, 'reason:', reason);
        // Don't exit - keep server running if possible
    });
    
    // Keep process alive by keeping event loop active
    // The HTTP server already does this, but we ensure it explicitly
    console.log('[Share Server] Process initialized, keeping alive...');
    
    // Prevent process from exiting
    // The server.listen() should keep it alive, but we add this as a safeguard
    setInterval(() => {
        // Keep event loop alive
        if (!serverInstance || !serverInstance.listening) {
            console.error('[Share Server] Server instance is not listening, exiting...');
            process.exit(1);
        }
    }, 10000); // Check every 10 seconds
}

module.exports = { startShareServer, stopShareServer };

