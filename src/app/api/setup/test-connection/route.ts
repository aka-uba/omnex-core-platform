import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/core-client';

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

    // Test connection
    const prisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrl },
      },
    });

    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: `${type} database connection successful`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Connection failed',
      details: error.toString(),
    }, { status: 500 });
  }
}


















