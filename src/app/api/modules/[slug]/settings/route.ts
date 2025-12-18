import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Module slug is required' },
        { status: 400 }
      );
    }

    // Try to read module.config.yaml
    const configPath = path.join(
      process.cwd(),
      'src',
      'modules',
      slug,
      'module.config.yaml'
    );

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: 'Module configuration not found' },
        { status: 404 }
      );
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Extract settings from config
    const settings = config.settings || [];

    // Try to load saved settings from JSON file
    const savedSettingsPath = path.join(
      process.cwd(),
      'data',
      'module-settings',
      `${slug}.json`
    );

    let savedSettings: Record<string, any> = {};
    if (fs.existsSync(savedSettingsPath)) {
      const savedContent = fs.readFileSync(savedSettingsPath, 'utf-8');
      savedSettings = JSON.parse(savedContent);
    }

    // Merge saved values with default settings
    const mergedSettings = settings.map((setting: any) => ({
      ...setting,
      value: (savedSettings as Record<string, any>)[setting.key] !== undefined 
        ? (savedSettings as Record<string, any>)[setting.key] 
        : setting.defaultValue,
    }));

    return NextResponse.json({
      success: true,
      data: mergedSettings,
    });
  } catch (error) {
    console.error('Error fetching module settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch settings',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: 'Module slug is required' },
        { status: 400 }
      );
    }

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data', 'module-settings');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save settings to JSON file
    const settingsPath = path.join(dataDir, `${slug}.json`);
    
    // Convert array of settings to key-value object
    const settingsObject: Record<string, any> = {};
    if (Array.isArray(body)) {
      body.forEach((setting: any) => {
        (settingsObject as Record<string, any>)[setting.key] = setting.value;
      });
    } else {
      Object.assign(settingsObject, body);
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settingsObject, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data: settingsObject,
    });
  } catch (error) {
    console.error('Error saving module settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save settings',
      },
      { status: 500 }
    );
  }
}

