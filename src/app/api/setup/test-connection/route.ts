import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { databaseUrl, type } = body; // type: 'core' | 'tenant'

    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Database URL is required',
      }, { status: 400 });
    }

    // Parse database name from URL
    const match = databaseUrl.match(/postgresql:\/\/[^/]+\/([^?]+)/);
    const dbName = match?.[1] || '';

    if (!dbName) {
      return NextResponse.json({
        success: false,
        error: 'Invalid database URL format',
      }, { status: 400 });
    }

    // Test connection by checking if database exists
    const result = await corePrisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${dbName}) as exists
    `;

    if (result[0]?.exists) {
      return NextResponse.json({
        success: true,
        message: `${type} database connection successful`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Database '${dbName}' does not exist`,
      }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Connection failed',
      details: error.toString(),
    }, { status: 500 });
  }
}
