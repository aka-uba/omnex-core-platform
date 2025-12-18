import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seedType, tenantSlug, coreDatabaseUrl, tenantDatabaseUrl } = body; // 'core' | 'tenant' | 'demo'

    if (!seedType) {
      return NextResponse.json({
        success: false,
        error: 'Seed type is required',
      }, { status: 400 });
    }

    let command = '';
    let description = '';

    switch (seedType) {
      case 'core':
        // Core seed needs tenant slug to create tenant record
        const coreTenantSlug = tenantSlug || 'omnexcore';
        const coreTenantName = body.tenantName || 'Omnex Core';
        const coreTenantDbName = body.tenantDbName || `tenant_${coreTenantSlug}_2025`;
        command = `npx tsx prisma/seed/core-seed.ts --tenant-slug=${coreTenantSlug} --tenant-name="${coreTenantName}" --tenant-db-name=${coreTenantDbName}`;
        description = 'Core database seed';
        break;
      case 'tenant':
        if (!tenantSlug) {
          return NextResponse.json({
            success: false,
            error: 'Tenant slug is required for tenant seed',
          }, { status: 400 });
        }
        command = `npx tsx prisma/seed/tenant-seed.ts --tenant-slug=${tenantSlug}`;
        description = 'Tenant database seed';
        break;
      case 'demo':
        if (!tenantSlug) {
          return NextResponse.json({
            success: false,
            error: 'Tenant slug is required for demo seed',
          }, { status: 400 });
        }
        // Use modular seeder system
        command = `npx tsx prisma/seed/modules/run-all.ts --tenant-slug=${tenantSlug}`;
        description = 'Demo data seed (modular)';
        break;
      case 'demo-legacy':
        // Keep legacy demo seed for backwards compatibility
        if (!tenantSlug) {
          return NextResponse.json({
            success: false,
            error: 'Tenant slug is required for demo seed',
          }, { status: 400 });
        }
        command = `npx tsx prisma/seed/demo-seed.ts --tenant-slug=${tenantSlug}`;
        description = 'Demo data seed (legacy)';
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid seed type',
        }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        CORE_DATABASE_URL: coreDatabaseUrl || process.env.CORE_DATABASE_URL,
        TENANT_DATABASE_URL: tenantDatabaseUrl || process.env.TENANT_DATABASE_URL,
      },
    });

    // Check for common errors
    if (stderr && !stderr.includes('WARNING')) {
      const solution = getSolution(stderr, seedType);
      return NextResponse.json({
        success: false,
        error: `${description} failed`,
        details: stderr,
        solution,
      }, { status: 500 });
    }

    // Check stdout for fatal errors (but allow warnings and expected messages)
    // Demo seed uses logError() which logs warnings but continues execution
    // Only fail if there's a fatal error that stops the script
    const fatalErrorPatterns = ['❌ Demo seed failed:', 'process.exit', 'throw error'];
    const hasFatalError = fatalErrorPatterns.some(pattern => stdout.includes(pattern));
    
    // For demo seed, check if it completed successfully
    if (seedType === 'demo' || seedType === 'demo-legacy') {
      // Check both modular and legacy completion messages
      const completedSuccessfully = stdout.includes('🎉 DEMO SEED COMPLETED!') ||
                                     stdout.includes('DEMO SEED COMPLETED') ||
                                     stdout.includes('🎉 MODULAR SEEDER COMPLETED!') ||
                                     stdout.includes('MODULAR SEEDER COMPLETED');
      if (!completedSuccessfully && hasFatalError) {
        const solution = getSolution(stdout, seedType);
        return NextResponse.json({
          success: false,
          error: `${description} failed`,
          details: stdout,
          solution,
        }, { status: 500 });
      }
      // Even if there are warnings, if it completed, it's a success
    } else {
      // For other seed types, check for errors
      if (stdout.includes('Error:') || stdout.includes('Failed')) {
        const solution = getSolution(stdout, seedType);
        return NextResponse.json({
          success: false,
          error: `${description} failed`,
          details: stdout,
          solution,
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${description} completed successfully`,
      output: stdout,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Seed execution failed',
      details: error.toString(),
      solution: getSolution(error.message, 'general'),
    }, { status: 500 });
  }
}

function getSolution(errorMessage: string, seedType: string): string {
  if (errorMessage.includes('PrismaClientValidationError')) {
    return 'Schema mismatch. Ensure database schema matches Prisma schema. Run database push first.';
  }
  if (errorMessage.includes('P2003')) {
    return 'Foreign key constraint failed. Ensure related records exist (e.g., User, Company).';
  }
  if (errorMessage.includes('tenant not found')) {
    return 'Tenant not found in core database. Create tenant first or check tenant slug.';
  }
  if (errorMessage.includes('connection')) {
    return 'Database connection failed. Check database URL and ensure PostgreSQL is running.';
  }
  if (seedType === 'tenant' && errorMessage.includes('company')) {
    return 'Company not found. Ensure core seed has been run first.';
  }
  return 'Check seed script and database state. Ensure all prerequisites are met.';
}

