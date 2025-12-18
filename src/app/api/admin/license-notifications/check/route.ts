// License Notification Service API Route - Admin
// POST /api/admin/license-notifications/check - Run license notification checks

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { licenseNotificationService } from '@/lib/license/LicenseNotificationService';
// POST /api/admin/license-notifications/check - Run license notification checks
export async function POST(request: NextRequest) {
  return withoutTenant<ApiResponse<{ success: boolean; message: string }>>(
    async () => {
      try {
        await licenseNotificationService.runAllChecks();
        
        return successResponse({
          success: true,
          message: 'License notification checks completed successfully',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to run license notification checks';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    'license'
  );
}







