import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface VulnerabilityInfo {
  name: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  via: string[];
  range: string;
  fixAvailable: boolean | { name: string; version: string };
}

interface AuditResult {
  vulnerabilities: Record<string, VulnerabilityInfo>;
  metadata: {
    vulnerabilities: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
      info: number;
    };
    dependencies: {
      total: number;
      prod: number;
      dev: number;
    };
  };
}

interface PackageVersions {
  next: string;
  react: string;
  reactDom: string;
  typescript: string;
  prisma: string;
}

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  details?: string;
  fixCommand?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'summary';

  try {
    switch (action) {
      case 'summary':
        return await getSecuritySummary();
      case 'audit':
        return await runNpmAudit();
      case 'outdated':
        return await getOutdatedPackages();
      case 'versions':
        return await getCurrentVersions();
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Security audit error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getSecuritySummary() {
  const checks: SecurityCheck[] = [];

  // 1. Check package versions
  const versions = await getPackageVersions();

  // Check Next.js version for known CVEs
  const nextVersion = versions.next.replace('^', '').replace('~', '');
  const nextMajor = parseInt(nextVersion.split('.')[0] || '0');
  const nextMinor = parseInt(nextVersion.split('.')[1] || '0');
  const nextPatch = parseInt(nextVersion.split('.')[2] || '0');

  // CVE-2025-55182 affects Next.js < 16.0.10, < 15.5.9, etc.
  let nextSecure = false;
  if (nextMajor === 16 && nextMinor === 0 && nextPatch >= 10) nextSecure = true;
  if (nextMajor === 15 && nextMinor === 5 && nextPatch >= 9) nextSecure = true;
  if (nextMajor === 15 && nextMinor === 4 && nextPatch >= 10) nextSecure = true;
  if (nextMajor > 16) nextSecure = true;

  checks.push({
    id: 'nextjs-version',
    name: 'Next.js Sürümü',
    description: 'CVE-2025-55182 (React2Shell) güvenlik yaması kontrolü',
    status: nextSecure ? 'pass' : 'fail',
    details: `Mevcut: ${versions.next}${!nextSecure ? ' - GÜNCELLEMENİZ GEREKİYOR!' : ''}`,
    fixCommand: !nextSecure ? 'npm install next@16.0.10' : undefined,
  });

  // Check React version
  const reactVersion = versions.react.replace('^', '').replace('~', '');
  const reactParts = reactVersion.split('.');
  const reactMajor = parseInt(reactParts[0] || '0');
  const reactMinor = parseInt(reactParts[1] || '0');
  const reactPatch = parseInt(reactParts[2] || '0');

  // React 19.2.3+ is safe
  let reactSecure = false;
  if (reactMajor === 19 && reactMinor === 2 && reactPatch >= 3) reactSecure = true;
  if (reactMajor === 19 && reactMinor === 1 && reactPatch >= 4) reactSecure = true;
  if (reactMajor === 19 && reactMinor === 0 && reactPatch >= 3) reactSecure = true;
  if (reactMajor > 19) reactSecure = true;

  checks.push({
    id: 'react-version',
    name: 'React Sürümü',
    description: 'CVE-2025-55182 güvenlik yaması kontrolü',
    status: reactSecure ? 'pass' : 'fail',
    details: `Mevcut: ${versions.react}${!reactSecure ? ' - GÜNCELLEMENİZ GEREKİYOR!' : ''}`,
    fixCommand: !reactSecure ? 'npm install react@19.2.3 react-dom@19.2.3' : undefined,
  });

  // 2. Run npm audit
  let auditResult: AuditResult | null = null;
  try {
    const { stdout } = await execAsync('npm audit --json', {
      cwd: process.cwd(),
      timeout: 30000
    });
    auditResult = JSON.parse(stdout) as AuditResult;
  } catch (error: unknown) {
    // npm audit exits with non-zero if vulnerabilities found
    if (error && typeof error === 'object' && 'stdout' in error) {
      try {
        auditResult = JSON.parse((error as { stdout: string }).stdout) as AuditResult;
      } catch {
        // Ignore parse errors
      }
    }
  }

  if (auditResult) {
    const vulns = auditResult.metadata?.vulnerabilities || { critical: 0, high: 0, moderate: 0, low: 0, total: 0 };
    const hasCritical = vulns.critical > 0;
    const hasHigh = vulns.high > 0;

    checks.push({
      id: 'npm-audit',
      name: 'NPM Güvenlik Taraması',
      description: 'Bağımlılıklarda bilinen güvenlik açıkları',
      status: hasCritical ? 'fail' : hasHigh ? 'warning' : vulns.total > 0 ? 'warning' : 'pass',
      details: `Kritik: ${vulns.critical}, Yüksek: ${vulns.high}, Orta: ${vulns.moderate}, Düşük: ${vulns.low}`,
      fixCommand: vulns.total > 0 ? 'npm audit fix' : undefined,
    });
  }

  // 3. Check for .env file exposure
  const envExists = await fileExists(path.join(process.cwd(), '.env'));
  const envLocalExists = await fileExists(path.join(process.cwd(), '.env.local'));
  const gitignoreContent = await readFileContent(path.join(process.cwd(), '.gitignore'));
  const envInGitignore = gitignoreContent?.includes('.env') || false;

  checks.push({
    id: 'env-security',
    name: '.env Dosya Güvenliği',
    description: '.env dosyalarının git\'te gizli olduğunu kontrol',
    status: envInGitignore ? 'pass' : 'warning',
    details: envInGitignore ? '.env dosyaları .gitignore\'da' : '.env dosyaları .gitignore\'a eklenmeli',
  });

  // 4. Check TypeScript strict mode
  const tsconfigContent = await readFileContent(path.join(process.cwd(), 'tsconfig.json'));
  let strictMode = false;
  if (tsconfigContent) {
    try {
      const tsconfig = JSON.parse(tsconfigContent);
      strictMode = tsconfig.compilerOptions?.strict === true;
    } catch {
      // Ignore parse errors
    }
  }

  checks.push({
    id: 'typescript-strict',
    name: 'TypeScript Strict Mode',
    description: 'Tip güvenliği için strict mode kontrolü',
    status: strictMode ? 'pass' : 'warning',
    details: strictMode ? 'Strict mode aktif' : 'Strict mode önerilir',
  });

  // Calculate overall status
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const passCount = checks.filter(c => c.status === 'pass').length;

  return NextResponse.json({
    success: true,
    data: {
      checks,
      summary: {
        total: checks.length,
        pass: passCount,
        warning: warningCount,
        fail: failCount,
        overallStatus: failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass',
      },
      versions,
      lastChecked: new Date().toISOString(),
    },
  });
}

async function runNpmAudit() {
  try {
    const { stdout, stderr } = await execAsync('npm audit --json', {
      cwd: process.cwd(),
      timeout: 60000,
    });

    const result = JSON.parse(stdout || '{}') as AuditResult;
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    // npm audit returns non-zero exit code if vulnerabilities found
    if (error && typeof error === 'object' && 'stdout' in error) {
      try {
        const result = JSON.parse((error as { stdout: string }).stdout) as AuditResult;
        return NextResponse.json({ success: true, data: result });
      } catch {
        // Ignore parse errors
      }
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Audit failed',
    });
  }
}

async function getOutdatedPackages() {
  try {
    const { stdout } = await execAsync('npm outdated --json', {
      cwd: process.cwd(),
      timeout: 60000,
    });

    const result = JSON.parse(stdout || '{}');
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    // npm outdated returns non-zero if packages are outdated
    if (error && typeof error === 'object' && 'stdout' in error) {
      try {
        const result = JSON.parse((error as { stdout: string }).stdout);
        return NextResponse.json({ success: true, data: result });
      } catch {
        return NextResponse.json({ success: true, data: {} });
      }
    }
    return NextResponse.json({ success: true, data: {} });
  }
}

async function getCurrentVersions(): Promise<NextResponse> {
  const versions = await getPackageVersions();
  return NextResponse.json({ success: true, data: versions });
}

async function getPackageVersions(): Promise<PackageVersions> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const content = await fs.readFile(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(content);

  return {
    next: pkg.dependencies?.next || 'unknown',
    react: pkg.dependencies?.react || 'unknown',
    reactDom: pkg.dependencies?.['react-dom'] || 'unknown',
    typescript: pkg.devDependencies?.typescript || 'unknown',
    prisma: pkg.devDependencies?.prisma || 'unknown',
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFileContent(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'fix':
        return await runNpmAuditFix();
      case 'update-security':
        return await updateSecurityPackages();
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function runNpmAuditFix() {
  try {
    const { stdout, stderr } = await execAsync('npm audit fix', {
      cwd: process.cwd(),
      timeout: 120000,
    });

    return NextResponse.json({
      success: true,
      data: { output: stdout, errors: stderr },
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Fix failed',
    });
  }
}

async function updateSecurityPackages() {
  try {
    // Update Next.js and React to secure versions
    const { stdout, stderr } = await execAsync(
      'npm install next@16.0.10 react@19.2.3 react-dom@19.2.3',
      {
        cwd: process.cwd(),
        timeout: 180000,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        output: stdout,
        errors: stderr,
        message: 'Güvenlik güncellemeleri başarıyla uygulandı',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    });
  }
}
