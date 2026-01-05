import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'pg';

const execAsync = promisify(exec);

/**
 * Validate identifier name to prevent SQL injection
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) && name.length <= 63;
}

/**
 * Escape identifier for safe use in SQL
 */
function escapeIdentifier(name: string): string {
  if (!isValidIdentifier(name)) {
    throw new Error('Invalid identifier: ' + name);
  }
  return '"' + name + '"';
}

/**
 * Drop all tables and sequences in a database using PostgreSQL
 */
async function dropAllTables(databaseUrl: string): Promise<void> {
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    // Uses parameterized query for security
    const tablesResult = await client.query(
      'SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename',
      ['public']
    );

    if (tablesResult.rows.length > 0) {
      for (const row of tablesResult.rows) {
        try {
          const safeName = escapeIdentifier(row.tablename);
          await client.query('DROP TABLE IF EXISTS "public".' + safeName + ' CASCADE');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('does not exist')) {
            console.warn('Warning: Could not drop table ' + row.tablename + ': ' + errorMessage);
          }
        }
      }
    }

    const sequencesResult = await client.query(
      'SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = $1 ORDER BY sequence_name',
      ['public']
    );

    if (sequencesResult.rows.length > 0) {
      for (const row of sequencesResult.rows) {
        try {
          const safeName = escapeIdentifier(row.sequence_name);
          await client.query('DROP SEQUENCE IF EXISTS "public".' + safeName + ' CASCADE');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('does not exist')) {
            console.warn('Warning: Could not drop sequence ' + row.sequence_name + ': ' + errorMessage);
          }
        }
      }
    }

  } finally {
    await client.end();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { databaseType, coreDatabaseUrl, tenantDatabaseUrl } = body;

    if (!databaseType) {
      return NextResponse.json({
        success: false,
        error: 'Database type is required',
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    if (databaseType === 'core' || databaseType === 'both') {
      try {
        const dbUrl = coreDatabaseUrl || process.env.CORE_DATABASE_URL;
        if (!dbUrl) throw new Error('CORE_DATABASE_URL is not set');

        await dropAllTables(dbUrl);
        await execAsync('npx prisma db push --accept-data-loss --schema=prisma/core.schema.prisma', {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, CORE_DATABASE_URL: dbUrl },
        });
        results.push({ type: 'core', success: true, message: 'Core database reset successfully' });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        errors.push({ type: 'core', error: errMsg, solution: 'Check core database connection.' });
      }
    }

    if (databaseType === 'tenant' || databaseType === 'both') {
      try {
        const dbUrl = tenantDatabaseUrl || process.env.TENANT_DATABASE_URL;
        if (!dbUrl) throw new Error('TENANT_DATABASE_URL is not set');

        await execAsync('npm run schema:merge', { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });
        await dropAllTables(dbUrl);
        await execAsync('npx prisma db push --accept-data-loss --schema=prisma/tenant.schema.prisma', {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, TENANT_DATABASE_URL: dbUrl },
        });
        results.push({ type: 'tenant', success: true, message: 'Tenant database reset successfully' });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        errors.push({ type: 'tenant', error: errMsg, solution: 'Check tenant database connection.' });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors, results, solution: 'Some databases failed.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Database reset completed', results });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMsg || 'Failed', details: String(error) }, { status: 500 });
  }
}
