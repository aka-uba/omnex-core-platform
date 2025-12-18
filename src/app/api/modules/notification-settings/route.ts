import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * GET /api/modules/notification-settings
 * Get all modules with their notification-related settings
 */
export async function GET(request: NextRequest) {
    try {
        const modulesDir = path.join(process.cwd(), 'src', 'modules');
        
        if (!fs.existsSync(modulesDir)) {
            return NextResponse.json({
                success: true,
                data: [],
            });
        }

        const moduleDirectories = fs.readdirSync(modulesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const modulesWithNotifications = [];

        for (const moduleSlug of moduleDirectories) {
            const configPath = path.join(modulesDir, moduleSlug, 'module.config.yaml');
            
            if (!fs.existsSync(configPath)) {
                continue;
            }

            try {
                const configContent = fs.readFileSync(configPath, 'utf-8');
                const config = yaml.load(configContent) as any;

                // Extract notification-related settings
                const allSettings = config.settings || [];
                const notificationSettings = allSettings.filter((setting: any) => {
                    const category = (setting.category || '').toLowerCase();
                    const key = (setting.key || '').toLowerCase();
                    return category.includes('notification') || 
                           category.includes('email') ||
                           key.includes('notification') ||
                           key.includes('enable');
                });

                // If module has notification settings, include it
                if (notificationSettings.length > 0 || config.name) {
                    modulesWithNotifications.push({
                        slug: moduleSlug,
                        name: config.name || moduleSlug,
                        description: config.description || '',
                        icon: config.icon || 'Package',
                        version: config.version || '1.0.0',
                        category: config.category || 'general',
                        notificationSettings: notificationSettings.map((setting: any) => ({
                            key: setting.key,
                            label: setting.label,
                            description: setting.description,
                            type: setting.type,
                            defaultValue: setting.defaultValue,
                            category: setting.category,
                            options: setting.options || null,
                            min: setting.min || null,
                            max: setting.max || null,
                        })),
                        // Check if module has enableNotifications setting
                        hasNotificationToggle: notificationSettings.some((s: any) => 
                            s.key === 'enableNotifications' || 
                            s.key === 'enableEmailNotifications' ||
                            s.key === 'enablePushNotifications' ||
                            s.key === 'enableSMSNotifications'
                        ),
                    });
                }
            } catch (error) {
                // Skip modules with invalid configs
                console.error(`Error reading module ${moduleSlug}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            data: modulesWithNotifications,
        });
    } catch (error) {
        console.error('Error fetching module notification settings:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch module notification settings',
            },
            { status: 500 }
        );
    }
}
















