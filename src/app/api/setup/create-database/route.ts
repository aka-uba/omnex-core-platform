import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  let adminClient: Client | null = null;
  
  try {
    const body = await request.json();
    const { databaseName, connectionString } = body;

    if (!databaseName || !connectionString) {
      return NextResponse.json({
        success: false,
        error: 'Veritabanı adı ve bağlantı string\'i gereklidir',
      }, { status: 400 });
    }

    // Extract connection info without database name
    // Parse connection string to get base connection
    const url = new URL(connectionString);
    const baseUrl = `${url.protocol}//${url.username}:${url.password}@${url.hostname}:${url.port || 5432}/postgres`;
    
    adminClient = new Client({ connectionString: baseUrl });

    await adminClient.connect();

    // Check if database exists
    const checkResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName]
    );

    if (checkResult.rows.length > 0) {
      await adminClient.end();
      return NextResponse.json({
        success: true,
        message: `Veritabanı ${databaseName} zaten mevcut`,
        exists: true,
      });
    }

    // Create database (use IF NOT EXISTS equivalent by checking first)
    await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    await adminClient.end();

    return NextResponse.json({
      success: true,
      message: `Veritabanı ${databaseName} başarıyla oluşturuldu`,
      exists: false,
    });
  } catch (error: any) {
    if (adminClient) {
      try {
        await adminClient.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Veritabanı oluşturma başarısız',
      details: error.toString(),
      solution: getSolution(error.message),
    }, { status: 500 });
  }
}

function getSolution(errorMessage: string): string {
  if (errorMessage.includes('permission denied')) {
    return 'PostgreSQL kullanıcı izinlerini kontrol edin. Kullanıcının CREATEDB yetkisi olduğundan emin olun.';
  }
  if (errorMessage.includes('already exists')) {
    return 'Veritabanı zaten mevcut. Bir sonraki adıma geçebilirsiniz.';
  }
  if (errorMessage.includes('ECONNREFUSED')) {
    return 'PostgreSQL sunucusu çalışmıyor. PostgreSQL servisini başlatın ve tekrar deneyin.';
  }
  if (errorMessage.includes('authentication')) {
    return 'PostgreSQL kimlik doğrulama hatası. Kullanıcı adı ve şifreyi kontrol edin.';
  }
  return 'PostgreSQL bağlantı ayarlarını kontrol edin ve sunucunun erişilebilir olduğundan emin olun.';
}

