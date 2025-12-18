import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { stdout, stderr } = await execAsync('npm run schema:merge', {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    if (stderr && !stderr.includes('WARNING')) {
      return NextResponse.json({
        success: false,
        error: 'Schema merge failed',
        details: stderr,
        solution: 'Check schema files for syntax errors. Ensure all module schemas are valid.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Schema merged successfully',
      output: stdout,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Schema merge failed',
      details: error.toString(),
      solution: 'Check that all schema files exist and are valid. Run "npm run schema:merge" manually to see detailed errors.',
    }, { status: 500 });
  }
}


















