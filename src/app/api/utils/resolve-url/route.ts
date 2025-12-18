import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';

// POST /api/utils/resolve-url - Resolve short URLs (for Google Maps links)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return errorResponse('Validation error', 'URL is required', 400);
    }

    // Only allow Google Maps URLs for security
    if (!url.includes('google.com') && !url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
      return errorResponse('Validation error', 'Only Google Maps URLs are allowed', 400);
    }

    // Fetch the URL to resolve redirects
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const finalUrl = response.url || url;

    return successResponse({
      originalUrl: url,
      resolvedUrl: finalUrl,
    });
  } catch (error: any) {
    console.error('Error resolving URL:', error);
    return errorResponse('Internal server error', error.message || 'Failed to resolve URL', 500);
  }
}















