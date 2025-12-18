// Check Slug/Subdomain Availability API
// GET /api/check-slug?slug=xxx
// GET /api/check-slug?subdomain=xxx
// GET /api/check-slug?slug=xxx&subdomain=yyy

import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    const subdomain = request.nextUrl.searchParams.get('subdomain');

    if (!slug && !subdomain) {
      return NextResponse.json(
        { success: false, error: 'Slug or subdomain is required' },
        { status: 400 }
      );
    }

    const result: {
      success: boolean;
      slug?: string;
      slugAvailable?: boolean;
      subdomain?: string;
      subdomainAvailable?: boolean;
    } = { success: true };

    // Check slug if provided
    if (slug) {
      const existingBySlug = await corePrisma.tenant.findUnique({
        where: { slug },
        select: { id: true },
      });
      result.slug = slug;
      result.slugAvailable = !existingBySlug;
    }

    // Check subdomain if provided
    if (subdomain) {
      const existingBySubdomain = await corePrisma.tenant.findUnique({
        where: { subdomain },
        select: { id: true },
      });
      result.subdomain = subdomain;
      result.subdomainAvailable = !existingBySubdomain;
    }

    // For backward compatibility
    if (slug && !subdomain) {
      return NextResponse.json({
        success: true,
        available: result.slugAvailable,
        slug,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error checking slug/subdomain:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
