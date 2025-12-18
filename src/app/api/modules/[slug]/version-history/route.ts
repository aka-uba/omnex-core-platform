import { NextRequest, NextResponse } from 'next/server';
import { readModuleVersionHistory } from '@/lib/modules/versionReader';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Module slug is required' },
        { status: 400 }
      );
    }

    const versionHistory = await readModuleVersionHistory(slug);

    return NextResponse.json({
      success: true,
      data: versionHistory,
    });
  } catch (error) {
    console.error('Error fetching module version history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch version history',
      },
      { status: 500 }
    );
  }
}

