import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import { registerSchema } from '@/lib/schemas/auth';
import bcrypt from 'bcryptjs';
export async function POST(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, message: 'Tenant context is required for registration' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Kullanıcı adı kontrolü
    const existingUsername = await tenantPrisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Email kontrolü
    const existingEmail = await tenantPrisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'Bu e-posta adresi zaten kayıtlı' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Yeni kullanıcı oluştur
    const newUser = await tenantPrisma.user.create({
      data: {
        name: validatedData.name,
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        role: 'ClientUser',
        status: 'pending', // Yönetici onayı bekliyor
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kayıt başarılı. Hesabınız yönetici onayı beklemektedir.',
      user: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username || undefined,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, message: 'Geçersiz form verisi' },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}




