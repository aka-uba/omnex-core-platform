import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if setup page should be accessible
 * In production, you might want to add authentication/authorization here
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Allow access if:
    // 1. Development mode
    // 2. Explicitly enabled via environment variable
    // 3. Not in production (or production access is explicitly enabled)
    const allowAccess = 
      isDevelopment || 
      process.env.ALLOW_SETUP_PAGE === 'true' ||
      (!isProduction && process.env.DISABLE_SETUP_PAGE !== 'true');

    if (!allowAccess) {
      return NextResponse.json({
        allowed: false,
        reason: 'Setup page is disabled in production. Set ALLOW_SETUP_PAGE=true to enable.',
      }, { status: 403 });
    }

    return NextResponse.json({
      allowed: true,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error: any) {
    return NextResponse.json({
      allowed: false,
      error: error.message,
    }, { status: 500 });
  }
}


















