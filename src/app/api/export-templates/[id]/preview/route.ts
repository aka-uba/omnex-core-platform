import { NextRequest, NextResponse } from 'next/server';
import { ExportTemplateService } from '@/lib/export/ExportTemplateService';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { logger } from '@/lib/utils/logger';
/**
 * GET /api/export-templates/[id]/preview
 * Generate preview HTML for template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    const tenantContext = await getTenantFromRequest(request);
    
    if (!tenantPrisma || !tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    const service = new ExportTemplateService(tenantPrisma);
    const searchParams = request.nextUrl.searchParams;
    const sampleData = searchParams.get('sampleData') 
      ? JSON.parse(searchParams.get('sampleData')!) 
      : undefined;

    const previewHtml = await service.generatePreview(id, sampleData);

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    logger.error('Failed to generate preview', error, 'api-export-templates');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate preview',
      },
      { status: 500 }
    );
  }
}
















