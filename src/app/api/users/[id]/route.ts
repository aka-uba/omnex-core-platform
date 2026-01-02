import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/utils/logger';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

// Helper function to sanitize user name for folder
function sanitizeUserNameForFolder(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tenant context is required',
          message: 'Please ensure you are logged in and have a valid tenant context. The user ID format suggests this might be a super admin user that requires tenant context.'
        },
        { status: 400 }
      );
    }

    // Find user - get all fields except relations
    let user = null;
    try {
      user = await tenantPrisma.user.findUnique({
        where: { id },
      });
    } catch (dbError) {
      // If database query fails, return more specific error
      const dbErrorMessage = dbError instanceof Error ? dbError.message : 'Database query failed';
      const dbErrorStack = dbError instanceof Error ? dbError.stack : undefined;
      logger.error('Database error fetching user', dbError, 'users-api', {
        id,
        error: dbErrorMessage,
        stack: dbErrorStack,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query failed',
          details: dbErrorMessage,
          ...(process.env.NODE_ENV === 'development' && { 
            stack: dbErrorStack?.substring(0, 500),
            userId: id 
          })
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Format response - exclude password and handle JSON fields
    const { password, ...userResponse } = user;
    
    return NextResponse.json({
      ...userResponse,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastActive: user.lastActive?.toISOString() || null,
      hireDate: user.hireDate?.toISOString() || null,
      // Ensure otherDocuments is properly serialized
      otherDocuments: user.otherDocuments ? (typeof user.otherDocuments === 'string' ? JSON.parse(user.otherDocuments) : user.otherDocuments) : null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    // Get tenant and audit context
    const tenantContext = await getTenantFromRequest(request);
    const auditContext = await getAuditContext(request);

    const { id } = await params;
    const contentType = request.headers.get('content-type');

    // Check if user exists
    const existingUser = await tenantPrisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    // Handle both JSON and FormData
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      const data = body.data || body;

      // Personal info
      if (data.personal) {
        if (data.personal.fullName !== undefined) updateData.name = data.personal.fullName;
        if (data.personal.email !== undefined) updateData.email = data.personal.email;
        if (data.personal.phone !== undefined) updateData.phone = data.personal.phone || null;
        if (data.personal.password) {
          // Hash password if provided
          updateData.password = await bcrypt.hash(data.personal.password, 10);
        }
        // Profile picture URL (if already uploaded)
        if (data.personal.profilePictureUrl) {
          updateData.profilePicture = data.personal.profilePictureUrl;
        }
      }

      // Work info
      if (data.work) {
        if (data.work.role !== undefined) updateData.role = data.work.role;
        if (data.work.department !== undefined) updateData.department = data.work.department || null;
        if (data.work.position !== undefined) updateData.position = data.work.position || null;
        if (data.work.employeeId !== undefined) updateData.employeeId = data.work.employeeId || null;
        if (data.work.hireDate !== undefined) {
          updateData.hireDate = data.work.hireDate ? new Date(data.work.hireDate) : null;
        }
        if (data.work.agencyIds && Array.isArray(data.work.agencyIds) && data.work.agencyIds.length > 0) {
          updateData.agencyId = data.work.agencyIds[0] || null;
        }
      }

      // Contact info
      if (data.contact) {
        if (data.contact.address !== undefined) updateData.address = data.contact.address || null;
        if (data.contact.city !== undefined) updateData.city = data.contact.city || null;
        if (data.contact.country !== undefined) updateData.country = data.contact.country || null;
        if (data.contact.postalCode !== undefined) updateData.postalCode = data.contact.postalCode || null;
        if (data.contact.emergencyContact !== undefined) updateData.emergencyContact = data.contact.emergencyContact || null;
        if (data.contact.emergencyPhone !== undefined) updateData.emergencyPhone = data.contact.emergencyPhone || null;
      }

      // Preferences
      if (data.preferences) {
        if (data.preferences.defaultLanguage !== undefined) updateData.defaultLanguage = data.preferences.defaultLanguage;
        if (data.preferences.defaultTheme !== undefined) updateData.defaultTheme = data.preferences.defaultTheme;
        if (data.preferences.defaultLayout !== undefined) updateData.defaultLayout = data.preferences.defaultLayout;
      }
    } else {
      // Handle FormData for file uploads
      const formData = await request.formData();

      // Get tenant context for file storage
      const tenant = await getTenantFromRequest(request);

      // Handle profile picture file upload
      const profilePictureFile = formData.get('profilePicture') as File | null;
      if (profilePictureFile && profilePictureFile instanceof File && tenant) {
        // Save file to tenant's user directory
        const { writeFile, mkdir } = await import('fs/promises');
        const { join } = await import('path');
        const { existsSync } = await import('fs');

        // Get user name and sanitize for folder name
        const userName = existingUser.name || id;
        const sanitizedUserName = sanitizeUserNameForFolder(userName);

        // Create user directory under tenant storage: storage/tenants/{slug}/users/{username}
        const userDir = join(process.cwd(), 'storage', 'tenants', tenant.slug, 'users', sanitizedUserName);
        if (!existsSync(userDir)) {
          await mkdir(userDir, { recursive: true });
        }

        // Create profile subfolder
        const profileDir = join(userDir, 'profile');
        if (!existsSync(profileDir)) {
          await mkdir(profileDir, { recursive: true });
        }

        const sanitizedFileName = profilePictureFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${sanitizedFileName}`;
        const filePath = join(profileDir, fileName);
        const bytes = await profilePictureFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        updateData.profilePicture = `/storage/tenants/${tenant.slug}/users/${sanitizedUserName}/profile/${fileName}`;
      }
      
      // Parse JSON data if exists (from nested form structure)
      const dataJson = formData.get('data');
      if (dataJson && typeof dataJson === 'string') {
        try {
          const data = JSON.parse(dataJson);
          
          // Personal info
          if (data.personal) {
            if (data.personal.fullName !== undefined) updateData.name = data.personal.fullName;
            if (data.personal.email !== undefined) updateData.email = data.personal.email;
            if (data.personal.phone !== undefined) updateData.phone = data.personal.phone || null;
            if (data.personal.password) {
              updateData.password = await bcrypt.hash(data.personal.password, 10);
            }
          }
          
          // Work info
          if (data.work) {
            if (data.work.role !== undefined) updateData.role = data.work.role;
            if (data.work.department !== undefined) updateData.department = data.work.department || null;
            if (data.work.position !== undefined) updateData.position = data.work.position || null;
            if (data.work.employeeId !== undefined) updateData.employeeId = data.work.employeeId || null;
            if (data.work.hireDate !== undefined) {
              updateData.hireDate = data.work.hireDate ? new Date(data.work.hireDate) : null;
            }
            if (data.work.agencyIds && Array.isArray(data.work.agencyIds) && data.work.agencyIds.length > 0) {
              updateData.agencyId = data.work.agencyIds[0] || null;
            }
          }
          
          // Contact info
          if (data.contact) {
            if (data.contact.address !== undefined) updateData.address = data.contact.address || null;
            if (data.contact.city !== undefined) updateData.city = data.contact.city || null;
            if (data.contact.country !== undefined) updateData.country = data.contact.country || null;
            if (data.contact.postalCode !== undefined) updateData.postalCode = data.contact.postalCode || null;
            if (data.contact.emergencyContact !== undefined) updateData.emergencyContact = data.contact.emergencyContact || null;
            if (data.contact.emergencyPhone !== undefined) updateData.emergencyPhone = data.contact.emergencyPhone || null;
          }
          
          // Preferences
          if (data.preferences) {
            if (data.preferences.defaultLanguage !== undefined) updateData.defaultLanguage = data.preferences.defaultLanguage;
            if (data.preferences.defaultTheme !== undefined) updateData.defaultTheme = data.preferences.defaultTheme;
            if (data.preferences.defaultLayout !== undefined) updateData.defaultLayout = data.preferences.defaultLayout;
          }
        } catch (e) {
          console.error('Error parsing JSON data:', e);
        }
      }
      
      // Fallback to direct formData fields (for backward compatibility)
      if (formData.has('fullName') && !updateData.name) updateData.name = formData.get('fullName') as string;
      if (formData.has('email') && !updateData.email) updateData.email = formData.get('email') as string;
      if (formData.has('phone') && updateData.phone === undefined) updateData.phone = formData.get('phone') as string;
      if (formData.has('role') && !updateData.role) updateData.role = formData.get('role') as string;
      if (formData.has('department') && updateData.department === undefined) updateData.department = formData.get('department') as string;
      if (formData.has('position') && updateData.position === undefined) updateData.position = formData.get('position') as string;
      if (formData.has('employeeId') && updateData.employeeId === undefined) updateData.employeeId = formData.get('employeeId') as string;
      if (formData.has('hireDate') && !updateData.hireDate) {
        const hireDate = formData.get('hireDate') as string;
        updateData.hireDate = hireDate ? new Date(hireDate) : null;
      }

      // Handle document file uploads (using tenant from line 199)
      if (tenant) {
        const userName = existingUser.name || id;
        const sanitizedUserName = sanitizeUserNameForFolder(userName);
        const { writeFile: writeDoc, mkdir: mkdirDoc } = await import('fs/promises');
        const { join: joinDoc } = await import('path');
        const { existsSync: existsSyncDoc } = await import('fs');

        // Create documents folder
        const userDocDir = joinDoc(process.cwd(), 'storage', 'tenants', tenant.slug, 'users', sanitizedUserName);
        const docsDir = joinDoc(userDocDir, 'documents');

        // Handle passport file
        const passportFile = formData.get('passport') as File | null;
        if (passportFile && passportFile instanceof File) {
          if (!existsSyncDoc(docsDir)) await mkdirDoc(docsDir, { recursive: true });
          const fileName = `passport-${Date.now()}-${passportFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const docFilePath = joinDoc(docsDir, fileName);
          const bytes = await passportFile.arrayBuffer();
          await writeDoc(docFilePath, Buffer.from(bytes));
          updateData.passportUrl = `/storage/tenants/${tenant.slug}/users/${sanitizedUserName}/documents/${fileName}`;
        }

        // Handle ID card file
        const idCardFile = formData.get('idCard') as File | null;
        if (idCardFile && idCardFile instanceof File) {
          if (!existsSyncDoc(docsDir)) await mkdirDoc(docsDir, { recursive: true });
          const fileName = `idcard-${Date.now()}-${idCardFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const docFilePath = joinDoc(docsDir, fileName);
          const bytes = await idCardFile.arrayBuffer();
          await writeDoc(docFilePath, Buffer.from(bytes));
          updateData.idCardUrl = `/storage/tenants/${tenant.slug}/users/${sanitizedUserName}/documents/${fileName}`;
        }

        // Handle contract file
        const contractFile = formData.get('contract') as File | null;
        if (contractFile && contractFile instanceof File) {
          if (!existsSyncDoc(docsDir)) await mkdirDoc(docsDir, { recursive: true });
          const fileName = `contract-${Date.now()}-${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const docFilePath = joinDoc(docsDir, fileName);
          const bytes = await contractFile.arrayBuffer();
          await writeDoc(docFilePath, Buffer.from(bytes));
          updateData.contractUrl = `/storage/tenants/${tenant.slug}/users/${sanitizedUserName}/documents/${fileName}`;
        }

        // Handle CV file
        const cvFile = formData.get('cv') as File | null;
        if (cvFile && cvFile instanceof File) {
          if (!existsSyncDoc(docsDir)) await mkdirDoc(docsDir, { recursive: true });
          const fileName = `cv-${Date.now()}-${cvFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const docFilePath = joinDoc(docsDir, fileName);
          const bytes = await cvFile.arrayBuffer();
          await writeDoc(docFilePath, Buffer.from(bytes));
          updateData.cvUrl = `/storage/tenants/${tenant.slug}/users/${sanitizedUserName}/documents/${fileName}`;
        }
      }
    }

    // Update user
    const updatedUser = await tenantPrisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profilePicture: true,
        phone: true,
        department: true,
        position: true,
        employeeId: true,
        hireDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log audit
    if (tenantContext) {
      logUpdate(tenantContext, auditContext, 'User', id, existingUser, updatedUser, '');
    }

    // Sync profile picture and documents to linked RealEstateStaff
    // This ensures changes made in users page are reflected in real-estate staff page
    try {
      // Find any real estate staff linked to this user
      const linkedStaff = await tenantPrisma.realEstateStaff.findFirst({
        where: { userId: id },
      });

      if (linkedStaff) {
        const syncData: any = {};

        // Sync profile picture
        if (updateData.profilePicture !== undefined) {
          syncData.profileImage = updateData.profilePicture || null;
        }

        // Sync document URLs (internal staff shares documents with user)
        if (updateData.passportUrl !== undefined) syncData.passportUrl = updateData.passportUrl || null;
        if (updateData.idCardUrl !== undefined) syncData.idCardUrl = updateData.idCardUrl || null;
        if (updateData.contractUrl !== undefined) syncData.contractUrl = updateData.contractUrl || null;
        if (updateData.cvUrl !== undefined) syncData.cvUrl = updateData.cvUrl || null;
        if (updateData.otherDocuments !== undefined) syncData.otherDocuments = updateData.otherDocuments || null;

        if (Object.keys(syncData).length > 0) {
          await tenantPrisma.realEstateStaff.update({
            where: { id: linkedStaff.id },
            data: syncData,
          });
        }
      }
    } catch (syncError) {
      console.warn('Failed to sync data to real estate staff:', syncError);
      // Don't fail the request if sync fails
    }

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
        hireDate: updatedUser.hireDate?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    // Get tenant and audit context
    const tenantContext = await getTenantFromRequest(request);
    const auditContext = await getAuditContext(request);

    // Check if user exists
    const existingUser = await tenantPrisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (cascade will handle related records)
    await tenantPrisma.user.delete({
      where: { id },
    });

    // Log audit
    if (tenantContext) {
      logDelete(tenantContext, auditContext, 'User', id, '', {
        name: existingUser.name,
        email: existingUser.email,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}




