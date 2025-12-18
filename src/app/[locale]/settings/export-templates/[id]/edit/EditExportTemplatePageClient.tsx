'use client';

import { useState, useEffect } from 'react';
import { Paper, Title, Text } from '@mantine/core';
import { EditExportTemplatePageSkeleton } from './EditExportTemplatePageSkeleton';
import { ExportTemplateForm } from '../../components/ExportTemplateForm';
import { useRouter } from 'next/navigation';
import { showToast } from '@/modules/notifications/components/ToastNotification';

interface EditExportTemplatePageClientProps {
    locale: string;
    templateId: string;
}

export function EditExportTemplatePageClient({
    locale,
    templateId,
}: EditExportTemplatePageClientProps) {
    const router = useRouter();
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplate();
    }, [templateId]);

    const loadTemplate = async () => {
        try {
            const response = await fetch(`/api/export-templates/${templateId}`);
            const result = await response.json();

            if (result.success) {
                setTemplate(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to load template',
            });
            router.push(`/${locale}/settings/export-templates`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        const response = await fetch(`/api/export-templates/${templateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: data.name,
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
                isActive: data.isActive,
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

    if (loading) {
        return <EditExportTemplatePageSkeleton />;
    }

    if (!template) {
        return null;
    }

    return (
        <div>
            <Paper p="md" mb="md">
                <Title order={2}>Edit Export Template</Title>
                <Text size="sm" c="dimmed">
                    Update export template configuration
                </Text>
            </Paper>

            <ExportTemplateForm
                initialData={{
                    name: template.name,
                    type: template.type,
                    companyId: template.companyId,
                    locationId: template.locationId,
                    logos: (template.customFields as any)?.logos || (template.logoUrl ? [{
                        id: 'logo-1',
                        url: template.logoUrl,
                        position: 'left',
                    }] : []),
                    headers: (template.customFields as any)?.headers || [
                        ...(template.title ? [{
                            id: 'header-1',
                            text: template.title,
                            position: 'left',
                        }] : []),
                        ...(template.subtitle ? [{
                            id: 'header-2',
                            text: template.subtitle,
                            position: 'left',
                        }] : []),
                    ],
                    footers: (template.customFields as any)?.footers || [],
                    address: template.address || '',
                    phone: template.phone || '',
                    email: template.email || '',
                    website: template.website || '',
                    taxNumber: template.taxNumber || '',
                    isDefault: template.isDefault,
                    isActive: template.isActive,
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isEdit
            />
        </div>
    );
}
