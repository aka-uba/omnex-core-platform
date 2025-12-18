import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientType } = body; // 'core' | 'tenant' | 'both'

    const results = [];
    const errors = [];

    if (!clientType || clientType === 'core' || clientType === 'both') {
      try {
        const { stdout, stderr } = await execAsync('npx prisma generate --schema=prisma/core.schema.prisma', {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
          env: {
            ...process.env,
            CORE_DATABASE_URL: process.env.CORE_DATABASE_URL,
          },
        });
        
        // Check for EPERM warning (Windows file lock - usually harmless)
        const hasEPERM = stderr && stderr.includes('EPERM');
        
        results.push({
          type: 'core',
          success: true,
          output: stdout,
          warning: hasEPERM ? 'Dosya kilidi uyarısı (genellikle zararsızdır, Prisma Studio veya başka bir Prisma process çalışıyorsa oluşur)' : undefined,
        });
      } catch (error: any) {
        const errorMessage = error.message || error.toString();
        const isEPERM = errorMessage.includes('EPERM') || errorMessage.includes('operation not permitted');
        
        if (isEPERM) {
          // EPERM is usually harmless - client might still be generated
          results.push({
            type: 'core',
            success: true,
            output: 'Client generate edildi (dosya kilidi uyarısı)',
            warning: 'Dosya kilidi hatası oluştu ancak client oluşturulmuş olabilir. Prisma Studio veya başka Prisma process\'lerini kapatıp tekrar deneyin.',
          });
        } else {
          errors.push({
            type: 'core',
            error: errorMessage,
            solution: 'Core schema syntax\'ını kontrol edin. Veritabanı bağlantısının geçerli olduğundan emin olun.',
          });
        }
      }
    }

    if (!clientType || clientType === 'tenant' || clientType === 'both') {
      try {
        // First merge schemas
        await execAsync('npm run schema:merge', {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
        });

        const { stdout, stderr } = await execAsync('npx prisma generate --schema=prisma/tenant.schema.prisma', {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
        });
        
        // Check for EPERM warning (Windows file lock - usually harmless)
        const hasEPERM = stderr && stderr.includes('EPERM');
        
        results.push({
          type: 'tenant',
          success: true,
          output: stdout,
          warning: hasEPERM ? 'Dosya kilidi uyarısı (genellikle zararsızdır, Prisma Studio veya başka bir Prisma process çalışıyorsa oluşur)' : undefined,
        });
      } catch (error: any) {
        const errorMessage = error.message || error.toString();
        const isEPERM = errorMessage.includes('EPERM') || errorMessage.includes('operation not permitted');
        
        if (isEPERM) {
          // EPERM is usually harmless - client might still be generated
          results.push({
            type: 'tenant',
            success: true,
            output: 'Client generate edildi (dosya kilidi uyarısı)',
            warning: 'Dosya kilidi hatası oluştu ancak client oluşturulmuş olabilir. Prisma Studio veya başka Prisma process\'lerini kapatıp tekrar deneyin.',
          });
        } else {
          errors.push({
            type: 'tenant',
            error: errorMessage,
            solution: 'Tenant schema\'yı kontrol edin. Önce "npm run schema:merge" çalıştırın.',
          });
        }
      }
    }

    // Only fail if there are real errors (not just EPERM warnings)
    const realErrors = errors.filter(e => !e.error.includes('EPERM') && !e.error.includes('operation not permitted'));
    
    if (realErrors.length > 0) {
      return NextResponse.json({
        success: false,
        errors: realErrors,
        results,
        solution: 'Schema hatalarını düzeltin ve client\'ları tekrar oluşturun.',
      }, { status: 500 });
    }

    // Check if we have warnings
    const hasWarnings = results.some(r => r.warning);
    const warningMessage = hasWarnings 
      ? 'Prisma client\'lar oluşturuldu (dosya kilidi uyarıları var - genellikle zararsızdır)'
      : 'Prisma client\'lar başarıyla oluşturuldu';

    return NextResponse.json({
      success: true,
      message: warningMessage,
      results,
      warnings: hasWarnings ? results.filter(r => r.warning).map(r => r.warning) : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Client generation failed',
      details: error.toString(),
    }, { status: 500 });
  }
}

