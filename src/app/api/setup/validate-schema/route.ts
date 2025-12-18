import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { validationType } = body; // 'tenant-bound' | 'relations' | 'all'

    const validations = [];
    const errors = [];

    // Tenant-bound validation
    if (!validationType || validationType === 'tenant-bound' || validationType === 'all') {
      try {
        const { stdout } = await execAsync('npm run schema:validate', {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
        });
        validations.push({
          type: 'tenant-bound',
          success: true,
          output: stdout,
        });
      } catch (error: any) {
        errors.push({
          type: 'tenant-bound',
          error: error.message,
          solution: 'Ensure all models (except User, Company) have tenantId and companyId fields.',
        });
      }
    }

    // Relations validation
    if (!validationType || validationType === 'relations' || validationType === 'all') {
      try {
        const { stdout } = await execAsync('npm run schema:validate-relations', {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
        });
        validations.push({
          type: 'relations',
          success: true,
          output: stdout,
        });
      } catch (error: any) {
        errors.push({
          type: 'relations',
          error: error.message,
          solution: 'Check cross-module relations. Ensure all relations follow the whitelist policy.',
        });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        validations,
        solution: 'Fix schema validation errors before proceeding.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All schema validations passed',
      validations,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Validation failed',
      details: error.toString(),
    }, { status: 500 });
  }
}


















