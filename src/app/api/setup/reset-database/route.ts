import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'pg';

const execAsync = promisify(exec);

/**
 * Drop all tables and sequences in a database using PostgreSQL
 */
async function dropAllTables(databaseUrl: string): Promise<void> {
  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    
    // Disable foreign key checks temporarily (PostgreSQL doesn't have this, but we use CASCADE)
    // First, get all table names
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    if (tablesResult.rows.length > 0) {
      // Drop all tables with CASCADE to handle foreign keys
      for (const row of tablesResult.rows) {
        try {
          await client.query(`DROP TABLE IF EXISTS "public"."${row.tablename}" CASCADE`);
        } catch (error: any) {
          // Ignore errors for tables that don't exist
          if (!error.message.includes('does not exist')) {
            console.warn(`Warning: Could not drop table ${row.tablename}: ${error.message}`);
          }
        }
      }
    }
    
    // Drop all sequences
    const sequencesResult = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `);
    
    if (sequencesResult.rows.length > 0) {
      for (const row of sequencesResult.rows) {
        try {
          await client.query(`DROP SEQUENCE IF EXISTS "public"."${row.sequence_name}" CASCADE`);
        } catch (error: any) {
          // Ignore errors for sequences that don't exist
          if (!error.message.includes('does not exist')) {
            console.warn(`Warning: Could not drop sequence ${row.sequence_name}: ${error.message}`);
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
    const { databaseType, coreDatabaseUrl, tenantDatabaseUrl } = body; // 'core' | 'tenant' | 'both'

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
        if (!dbUrl) {
          throw new Error('CORE_DATABASE_URL is not set');
        }

        // First drop all tables and sequences
        await dropAllTables(dbUrl);

        // Then apply schema
        await execAsync(
          'npx prisma db push --accept-data-loss --schema=prisma/core.schema.prisma',
          {
            cwd: process.cwd(),
            maxBuffer: 10 * 1024 * 1024,
            env: {
              ...process.env,
              CORE_DATABASE_URL: dbUrl,
            },
          }
        );
        results.push({
          type: 'core',
          success: true,
          message: 'Core database reset successfully',
        });
      } catch (error: any) {
        errors.push({
          type: 'core',
          error: error.message,
          solution: 'Check core database connection and permissions.',
        });
      }
    }

    if (databaseType === 'tenant' || databaseType === 'both') {
      try {
        const dbUrl = tenantDatabaseUrl || process.env.TENANT_DATABASE_URL;
        if (!dbUrl) {
          throw new Error('TENANT_DATABASE_URL is not set');
        }

        // First merge schemas
        await execAsync('npm run schema:merge', {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
        });

        // Then drop all tables and sequences
        await dropAllTables(dbUrl);

        // Then apply schema
        await execAsync(
          'npx prisma db push --accept-data-loss --schema=prisma/tenant.schema.prisma',
          {
            cwd: process.cwd(),
            maxBuffer: 10 * 1024 * 1024,
            env: {
              ...process.env,
              TENANT_DATABASE_URL: dbUrl,
            },
          }
        );
        results.push({
          type: 'tenant',
          success: true,
          message: 'Tenant database reset successfully',
        });
      } catch (error: any) {
        errors.push({
          type: 'tenant',
          error: error.message,
          solution: 'Check tenant database connection. Ensure schema merge completed successfully.',
        });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        results,
        solution: 'Some databases failed to reset. Check errors above.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Database reset failed',
      details: error.toString(),
    }, { status: 500 });
  }
}
