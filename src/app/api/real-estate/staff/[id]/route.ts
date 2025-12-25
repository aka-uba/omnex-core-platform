import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { realEstateStaffSchema } from '@/modules/real-estate/schemas/staff.schema';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';

// GET /api/real-estate/staff/[id] - Get single staff
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ staff: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get staff with properties
      const staff = await tenantPrisma.realEstateStaff.findUnique({
        where: { id },
        include: {
          properties: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!staff) {
        return errorResponse('Staff not found', 'Real estate staff not found', 404);
      }

      // Check tenant access
      if (staff.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Build response with documents
      let staffWithUser = staff as any;
      let documents: Array<{ name: string; url: string; type: string }> = [];

      if (staff.staffType === 'internal' && staff.userId) {
        // Internal staff: Fetch user data and documents from User table
        const user = await tenantPrisma.user.findUnique({
          where: { id: staff.userId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            profilePicture: true,
            department: true,
            position: true,
            employeeId: true,
            hireDate: true,
            address: true,
            city: true,
            country: true,
            postalCode: true,
            emergencyContact: true,
            emergencyPhone: true,
            defaultLanguage: true,
            defaultTheme: true,
            defaultLayout: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
            // Document fields for syncing
            passportUrl: true,
            idCardUrl: true,
            contractUrl: true,
            cvUrl: true,
            otherDocuments: true,
          },
        });

        if (user) {
          // Build documents list from user's documents
          if (user.passportUrl) {
            documents.push({ name: 'Pasaport', url: user.passportUrl, type: 'passport' });
          }
          if (user.idCardUrl) {
            documents.push({ name: 'Kimlik Kartı', url: user.idCardUrl, type: 'idCard' });
          }
          if (user.contractUrl) {
            documents.push({ name: 'Sözleşme', url: user.contractUrl, type: 'contract' });
          }
          if (user.cvUrl) {
            documents.push({ name: 'CV', url: user.cvUrl, type: 'cv' });
          }
          // Handle other documents if present
          if (user.otherDocuments && Array.isArray(user.otherDocuments)) {
            for (const doc of user.otherDocuments as any[]) {
              if (doc && doc.url) {
                documents.push({ name: doc.name || 'Belge', url: doc.url, type: 'other' });
              }
            }
          }

          staffWithUser = {
            ...staff,
            linkedUser: user,
            documents, // Include documents from linked user
          };
        }
      } else if (staff.staffType === 'external') {
        // External staff: Get documents from staff's own document fields
        const staffAny = staff as any;
        if (staffAny.passportUrl) {
          documents.push({ name: 'Pasaport', url: staffAny.passportUrl, type: 'passport' });
        }
        if (staffAny.idCardUrl) {
          documents.push({ name: 'Kimlik Kartı', url: staffAny.idCardUrl, type: 'idCard' });
        }
        if (staffAny.contractUrl) {
          documents.push({ name: 'Sözleşme', url: staffAny.contractUrl, type: 'contract' });
        }
        if (staffAny.cvUrl) {
          documents.push({ name: 'CV', url: staffAny.cvUrl, type: 'cv' });
        }
        // Handle other documents if present
        if (staffAny.otherDocuments && Array.isArray(staffAny.otherDocuments)) {
          for (const doc of staffAny.otherDocuments as any[]) {
            if (doc && doc.url) {
              documents.push({ name: doc.name || 'Belge', url: doc.url, type: 'other' });
            }
          }
        }

        staffWithUser = {
          ...staff,
          documents,
        };
      }

      return successResponse({ staff: staffWithUser });
    }
  );
}

// PATCH /api/real-estate/staff/[id] - Update staff
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ staff: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const { id } = await params;
        const body = await request.json();

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get existing staff
        const existing = await tenantPrisma.realEstateStaff.findUnique({
          where: { id },
        });

        if (!existing) {
          return errorResponse('Staff not found', 'Real estate staff not found', 404);
        }

        // Check tenant access
        if (existing.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Validate input (partial)
        const validatedData = realEstateStaffSchema.partial().parse(body);

        // Calculate assignedUnits if apartmentIds changed
        const apartmentIds = validatedData.apartmentIds !== undefined ? validatedData.apartmentIds : existing.apartmentIds;
        const assignedUnits = apartmentIds.length;

        // Update staff
        const staff = await tenantPrisma.realEstateStaff.update({
          where: { id },
          data: {
            ...(validatedData.userId !== undefined && { userId: validatedData.userId || null }),
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.email !== undefined && { email: validatedData.email || null }),
            ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
            ...(validatedData.staffType && { staffType: validatedData.staffType }),
            ...(validatedData.role && { role: validatedData.role }),
            ...(validatedData.permissions !== undefined && { permissions: validatedData.permissions as any || null }),
            ...(validatedData.propertyIds !== undefined && { propertyIds: validatedData.propertyIds }),
            ...(validatedData.apartmentIds !== undefined && { apartmentIds: validatedData.apartmentIds }),
            ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
            ...(validatedData.profileImage !== undefined && { profileImage: validatedData.profileImage || null }),
            ...(body.isActive !== undefined && { isActive: body.isActive }),
            assignedUnits,
            ...(body.collectionRate !== undefined && {
              collectionRate: body.collectionRate ? new Prisma.Decimal(body.collectionRate) : null,
            }),
            ...(body.averageVacancyDays !== undefined && {
              averageVacancyDays: body.averageVacancyDays ? new Prisma.Decimal(body.averageVacancyDays) : null,
            }),
            ...(body.customerSatisfaction !== undefined && {
              customerSatisfaction: body.customerSatisfaction ? new Prisma.Decimal(body.customerSatisfaction) : null,
            }),
            // Document fields for external staff
            ...(body.passportUrl !== undefined && { passportUrl: body.passportUrl || null }),
            ...(body.idCardUrl !== undefined && { idCardUrl: body.idCardUrl || null }),
            ...(body.contractUrl !== undefined && { contractUrl: body.contractUrl || null }),
            ...(body.cvUrl !== undefined && { cvUrl: body.cvUrl || null }),
            ...(body.otherDocuments !== undefined && { otherDocuments: body.otherDocuments || null }),
          },
        });

        // Sync profile image to linked User if internal staff
        // This ensures changes made in real-estate staff page are reflected in users page
        if (existing.staffType === 'internal' && existing.userId && validatedData.profileImage !== undefined) {
          try {
            await tenantPrisma.user.update({
              where: { id: existing.userId },
              data: { profilePicture: validatedData.profileImage || null },
            });
          } catch (syncError) {
            console.warn('Failed to sync profile image to user:', syncError);
            // Don't fail the request if sync fails
          }
        }

        // Sync documents from staff to User if internal staff
        if (existing.staffType === 'internal' && existing.userId) {
          const docUpdates: any = {};
          if (body.passportUrl !== undefined) docUpdates.passportUrl = body.passportUrl || null;
          if (body.idCardUrl !== undefined) docUpdates.idCardUrl = body.idCardUrl || null;
          if (body.contractUrl !== undefined) docUpdates.contractUrl = body.contractUrl || null;
          if (body.cvUrl !== undefined) docUpdates.cvUrl = body.cvUrl || null;
          if (body.otherDocuments !== undefined) docUpdates.otherDocuments = body.otherDocuments || null;

          if (Object.keys(docUpdates).length > 0) {
            try {
              await tenantPrisma.user.update({
                where: { id: existing.userId },
                data: docUpdates,
              });
            } catch (syncError) {
              console.warn('Failed to sync documents to user:', syncError);
              // Don't fail the request if sync fails
            }
          }
        }

        return successResponse({ staff });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error updating staff:', error);
        return errorResponse(
          'Failed to update staff',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

// DELETE /api/real-estate/staff/[id] - Delete staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get existing staff
      const existing = await tenantPrisma.realEstateStaff.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Staff not found', 'Real estate staff not found', 404);
      }

      // Check tenant access
      if (existing.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Delete staff
      await tenantPrisma.realEstateStaff.delete({
        where: { id },
      });

      return successResponse({ success: true });
    }
  );
}

