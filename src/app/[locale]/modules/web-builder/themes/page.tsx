'use client';

import { Title, Text } from '@mantine/core';

export default function ThemesPage() {
    return (
        <div className="p-6">
            <Title order={2}>Themes</Title>
            <Text c="dimmed">Manage global themes and styles</Text>
            <div className="mt-8 p-12 text-center border-2 border-dashed rounded-lg bg-gray-50">
                <Text c="dimmed">Theme manager coming soon...</Text>
            </div>
        </div>
    );
}






