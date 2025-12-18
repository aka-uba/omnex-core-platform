import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { databaseType, forceReset } = body; // 'core' | 'tenant', forceReset: boolean

    if (!databaseType) {
      return NextResponse.json({
        success: false,
        error: 'Database type is required',
      }, { status: 400 });
    }

    const schemaPath = databaseType === 'core' 
      ? 'prisma/core.schema.prisma'
      : 'prisma/tenant.schema.prisma';

    const command = forceReset
      ? `npx prisma db push --force-reset --accept-data-loss --schema=${schemaPath}`
      : `npx prisma db push --accept-data-loss --schema=${schemaPath}`;

    // Get database URL from request body or environment
    const dbUrl = databaseType === 'core' 
      ? (body.coreDatabaseUrl || process.env.CORE_DATABASE_URL)
      : (body.tenantDatabaseUrl || process.env.TENANT_DATABASE_URL);

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        CORE_DATABASE_URL: databaseType === 'core' ? dbUrl : process.env.CORE_DATABASE_URL,
        TENANT_DATABASE_URL: databaseType === 'tenant' ? dbUrl : process.env.TENANT_DATABASE_URL,
      },
    });

    if (stderr && !stderr.includes('WARNING') && !stderr.includes('EPERM')) {
      return NextResponse.json({
        success: false,
        error: 'Database push failed',
        details: stderr,
        solution: getSolution(stderr),
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${databaseType} database schema applied successfully`,
      output: stdout,
      warning: stderr.includes('EPERM') ? 'File lock warning (can be ignored)' : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Database push failed',
      details: error.toString(),
      solution: getSolution(error.message),
    }, { status: 500 });
  }
}

function getSolution(errorMessage: string): string {
  if (errorMessage.includes('EPERM')) {
    return 'File lock detected. This is usually harmless. Try closing Prisma Studio or other Prisma processes.';
  }
  if (errorMessage.includes('connection')) {
    return 'Check database connection. Ensure PostgreSQL is running and connection string is correct.';
  }
  if (errorMessage.includes('schema')) {
    return 'Check schema syntax. Run "npm run schema:merge" first if using tenant schema.';
  }
  return 'Check database permissions and ensure the database exists.';
}

