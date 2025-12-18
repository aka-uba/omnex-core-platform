'use client';

import { Paper, Title, Text } from '@mantine/core';
import { ExportTemplateForm } from '../components/ExportTemplateForm';
import { useRouter } from 'next/navigation';

interface CreateExportTemplatePageClientProps {
    locale: string;
}

export function CreateExportTemplatePageClient({ locale }: CreateExportTemplatePageClientProps) {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const response = await fetch('/api/export-templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: data.name,
                type: data.type,
                companyId: data.companyId || null,
                locationId: data.locationId || null,
                templateData: data.templateData || {
                    logoUrl: data.logos?.[0]?.url,
                    title: data.headers?.[0]?.text,
                    subtitle: data.headers?.[1]?.text,
                    address: data.address,
                    phone: data.phone,
                    email: data.email,
                    website: data.website,
                    taxNumber: data.taxNumber,
                    customFields: {
                        logos: data.logos || [],
                        headers: data.headers || [],
                        footers: data.footers || [],
                    },
                },
                isDefault: data.isDefault,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        router.push(`/${locale}/settings/export-templates`);
    };

    const handleCancel = () => {
        router.push(`/${locale}/settings/export-templates`);
    };

    return (
        <div>
            <Paper p="md" mb="md">
                <Title order={2}>Create Export Template</Title>
                <Text size="sm" c="dimmed">
                    Create a new export template for documents
                </Text>
            </Paper>

            <ExportTemplateForm onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
    );
}
