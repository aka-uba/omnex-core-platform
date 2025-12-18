import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// POST for file upload
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const formData = await request.formData();
    const file = formData.get('icon') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, SVG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 2MB allowed.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'modules', slug);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `icon-${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/uploads/modules/${slug}/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName,
      },
    });
  } catch (error) {
    console.error('Error uploading module icon:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload icon',
      },
      { status: 500 }
    );
  }
}

// PUT for updating icon name (Tabler icon name)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { icon } = body;

    if (!icon || typeof icon !== 'string') {
      return NextResponse.json(
        { error: 'Icon name is required' },
        { status: 400 }
      );
    }

    // Update module.config.yaml
    const configPath = path.join(
      process.cwd(),
      'src',
      'modules',
      slug,
      'module.config.yaml'
    );

    if (!existsSync(configPath)) {
      return NextResponse.json(
        { error: 'Module configuration not found' },
        { status: 404 }
      );
    }

    // Read current config
    const configContent = await readFile(configPath, 'utf-8');
    const config = yaml.load(configContent) as Record<string, unknown>;

    // Update icon
    config.icon = icon;

    // Write back to file
    const newConfigContent = yaml.dump(config, { indent: 2, lineWidth: -1 });
    await writeFile(configPath, newConfigContent, 'utf-8');

    return NextResponse.json({
      success: true,
      data: { icon },
      message: 'Module icon updated successfully',
    });
  } catch (error) {
    console.error('Error updating module icon:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update icon',
      },
      { status: 500 }
    );
  }
}

