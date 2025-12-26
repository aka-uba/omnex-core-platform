import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Admin token for security - should be set in environment variables
const ADMIN_TOKEN = process.env.SERVER_ADMIN_TOKEN || 'omnex-admin-2025';

// Allowed commands whitelist
const ALLOWED_COMMANDS: Record<string, string> = {
  'pm2-status': 'pm2 jlist',
  'pm2-restart': 'pm2 restart omnex-core',
  'pm2-stop': 'pm2 stop omnex-core',
  'pm2-start': 'pm2 start omnex-core',
  'pm2-logs': 'pm2 logs omnex-core --lines 50 --nostream',
  'system-info': 'echo "$(free -h)" && echo "---" && echo "$(df -h /)" && echo "---" && echo "$(uptime)"',
  'prisma-generate': 'cd /var/www/omnex-core && npx prisma generate --schema=prisma/core.schema.prisma && npx prisma generate --schema=prisma/tenant.schema.prisma',
  'clear-cache': 'cd /var/www/omnex-core && rm -rf .next/cache && echo "Cache cleared"',
  'node-version': 'node -v && npm -v',
};

export async function GET(request: NextRequest) {
  const token = request.headers.get('x-admin-token') || request.nextUrl.searchParams.get('token');

  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized - Invalid admin token',
    }, { status: 401 });
  }

  // Return available commands
  return NextResponse.json({
    success: true,
    commands: Object.keys(ALLOWED_COMMANDS),
    message: 'Use POST to execute a command',
  });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-admin-token') || request.nextUrl.searchParams.get('token');

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid admin token',
      }, { status: 401 });
    }

    const body = await request.json();
    const { command } = body;

    if (!command || !ALLOWED_COMMANDS[command]) {
      return NextResponse.json({
        success: false,
        error: `Invalid command. Allowed: ${Object.keys(ALLOWED_COMMANDS).join(', ')}`,
      }, { status: 400 });
    }

    const cmdToRun = ALLOWED_COMMANDS[command];

    try {
      const { stdout, stderr } = await execAsync(cmdToRun, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      // Parse PM2 JSON output for pm2-status
      let parsedOutput = stdout;
      if (command === 'pm2-status') {
        try {
          const pm2Data = JSON.parse(stdout);
          parsedOutput = JSON.stringify(pm2Data.map((p: any) => ({
            name: p.name,
            status: p.pm2_env?.status,
            cpu: p.monit?.cpu,
            memory: Math.round((p.monit?.memory || 0) / 1024 / 1024),
            uptime: p.pm2_env?.pm_uptime ? Math.round((Date.now() - p.pm2_env.pm_uptime) / 1000) : 0,
            restarts: p.pm2_env?.restart_time || 0,
            pid: p.pid,
          })), null, 2);
        } catch {
          // Keep original output if JSON parse fails
        }
      }

      return NextResponse.json({
        success: true,
        command,
        output: parsedOutput,
        stderr: stderr || undefined,
        timestamp: new Date().toISOString(),
      });
    } catch (execError: any) {
      return NextResponse.json({
        success: false,
        command,
        error: execError.message,
        stderr: execError.stderr,
        stdout: execError.stdout,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to execute command',
    }, { status: 500 });
  }
}
