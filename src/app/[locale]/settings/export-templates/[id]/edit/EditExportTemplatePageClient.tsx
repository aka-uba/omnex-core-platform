'use client';

import { useState, useEffect } from 'react';
import { Paper, Title, Text } from '@mantine/core';
import { EditExportTemplatePageSkeleton } from './EditExportTemplatePageSkeleton';
import { ExportTemplateForm } from '../../components/ExportTemplateForm';
import { useRouter } from 'next/navigation';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type { TemplateSection } from '@/lib/export/types';

interface EditExportTemplatePageClientProps {
    locale: string;
    templateId: string;
}

// Helper to migrate old format to new sections format
function migrateToSections(template: any): { headerSections: TemplateSection[]; footerSections: TemplateSection[] } {
    // If already has new format, return it
    if (template.customFields?.headerSections || template.headerSections) {
        return {
            headerSections: template.customFields?.headerSections || template.headerSections || [],
            footerSections: template.customFields?.footerSections || template.footerSections || [],
        };
    }

    // Migrate from old format
    const headerSections: TemplateSection[] = [];
    const footerSections: TemplateSection[] = [];

    const oldLogos = (template.customFields as any)?.logos || [];
    const oldHeaders = (template.customFields as any)?.headers || [];
    const oldFooters = (template.customFields as any)?.footers || [];

    // Create header section from old logos and headers
    if (oldLogos.length > 0 || oldHeaders.length > 0 || template.logoUrl || template.title) {
        const columns: any[] = [];

        // Logo column
        if (oldLogos.length > 0 || template.logoUrl) {
            columns.push({
                id: `col-${Date.now()}-1`,
                items: [{
                    id: `item-${Date.now()}-1`,
                    type: 'logo',
                    logoUrl: oldLogos[0]?.url || template.logoUrl,
                    textAlign: oldLogos[0]?.position || 'left',
                }],
            });
        }

        // Title column
        if (oldHeaders.length > 0 || template.title) {
            columns.push({
                id: `col-${Date.now()}-2`,
                items: [{
                    id: `item-${Date.now()}-2`,
                    type: 'text',
                    value: oldHeaders[0]?.text || template.title || '',
                    fontWeight: 'bold',
                    textAlign: oldHeaders[0]?.position || 'center',
                }],
            });
        }

        // Subtitle if exists
        if (oldHeaders.length > 1 || template.subtitle) {
            const lastCol = columns[columns.length - 1];
            if (lastCol) {
                lastCol.items.push({
                    id: `item-${Date.now()}-3`,
                    type: 'text',
                    value: oldHeaders[1]?.text || template.subtitle || '',
                    textAlign: oldHeaders[1]?.position || 'center',
                });
            }
        }

        if (columns.length > 0) {
            headerSections.push({
                id: `section-${Date.now()}-1`,
                columns,
            });
        }
    }

    // Create footer sections from old footers
    if (oldFooters.length > 0) {
        footerSections.push({
            id: `section-${Date.now()}-2`,
            columns: [{
                id: `col-${Date.now()}-3`,
                items: oldFooters.map((footer: any, idx: number) => ({
                    id: `item-${Date.now()}-${idx + 10}`,
                    type: 'text',
                    value: footer.text || '',
                    textAlign: footer.position || 'center',
                })),
            }],
        });
    }

    return { headerSections, footerSections };
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
                    address: data.address,
                    phone: data.phone,
                    email: data.email,
                    website: data.website,
                    taxNumber: data.taxNumber,
                    headerSections: data.headerSections || [],
                    footerSections: data.footerSections || [],
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

    // Migrate old format to new sections format
    const { headerSections, footerSections } = migrateToSections(template);

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
                    headerSections,
                    footerSections,
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
