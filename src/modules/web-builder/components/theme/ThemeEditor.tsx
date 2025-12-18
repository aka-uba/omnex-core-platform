'use client';

import { Tabs, ScrollArea } from '@mantine/core';
import { IconPalette, IconTypography } from '@tabler/icons-react';
import { ColorPalette } from './ColorPalette';
import { TypographyEditor } from './TypographyEditor';

export function ThemeEditor() {
    return (
        <div className="h-full flex flex-col bg-white border-l w-80">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Theme Settings</h2>
            </div>

            <Tabs defaultValue="colors" className="flex-1 flex flex-col">
                <Tabs.List grow>
                    <Tabs.Tab value="colors" leftSection={<IconPalette size={16} />}>
                        Colors
                    </Tabs.Tab>
                    <Tabs.Tab value="typography" leftSection={<IconTypography size={16} />}>
                        Type
                    </Tabs.Tab>
                </Tabs.List>

                <ScrollArea className="flex-1 p-4">
                    <Tabs.Panel value="colors">
                        <ColorPalette />
                    </Tabs.Panel>
                    <Tabs.Panel value="typography">
                        <TypographyEditor />
                    </Tabs.Panel>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
