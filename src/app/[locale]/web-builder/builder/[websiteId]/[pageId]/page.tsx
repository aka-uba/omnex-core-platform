'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { BuilderCanvas } from '@/modules/web-builder/components/builder/BuilderCanvas';
import { BuilderToolbar } from '@/modules/web-builder/components/builder/BuilderToolbar';
import { BuilderProperties } from '@/modules/web-builder/components/builder/BuilderProperties';
import { PageSection } from '@/modules/web-builder/types/builder.types';

import { ThemeProvider } from '@/modules/web-builder/hooks/useTheme';
import { ThemeEditor } from '@/modules/web-builder/components/theme/ThemeEditor';
import { ActionIcon, Tooltip, Tabs } from '@mantine/core';
import { IconPalette, IconSettings, IconSeo, IconEye, IconCode } from '@tabler/icons-react';
import { initWebBuilderModule } from '@/modules/web-builder/services/init';
import { initAccountingModule } from '@/modules/accounting/services/init';
import { initProductionModule } from '@/modules/production/services/init';
import { initHRModule } from '@/modules/hr/services/init';
import { initMaintenanceModule } from '@/modules/maintenance/services/init';
import { SEOPanel, type SEOSettings } from '@/modules/web-builder/components/seo/SEOPanel';
import { SEOPreview } from '@/modules/web-builder/components/seo/SEOPreview';
import { PagePreview } from '@/modules/web-builder/components/preview/PagePreview';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function BuilderPage({ params }: { params: { websiteId: string; pageId: string } }) {
    const [sections, setSections] = useState<PageSection[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [activePanel, setActivePanel] = useState<'properties' | 'theme' | 'seo' | 'preview'>('properties');
    const [seoSettings, setSeoSettings] = useState<SEOSettings>({
        metaTitle: '',
        metaDescription: '',
        metaKeywords: [],
    });
    const [showPreview, setShowPreview] = useState(false);

    // Initialize widgets on mount
    useEffect(() => {
        initWebBuilderModule();
        initAccountingModule();
        initProductionModule();
        initHRModule();
        initMaintenanceModule();
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && over.id === 'canvas') {
            // Add new section/widget
            const widgetId = active.data.current?.widgetId || active.data.current?.type;
            if (widgetId) {
                const newSection: PageSection = {
                    id: Date.now().toString(),
                    type: 'default',
                    order: sections.length,
                    elements: [
                        {
                            id: Date.now().toString() + '-el',
                            type: widgetId, // Use full widget ID (e.g., 'accounting.invoices')
                            content: {},
                            settings: {},
                        },
                    ],
                    settings: {},
                };
                setSections([...sections, newSection]);
            }
        }
    };

    const handleSelectElement = (elementId: string) => {
        setSelectedElementId(elementId);
        if (elementId) setActivePanel('properties');
    };

    const handleDeleteElement = () => {
        if (selectedElementId) {
            setSections(sections.map(section => ({
                ...section,
                elements: section.elements.filter(el => el.id !== selectedElementId)
            })).filter(section => section.elements.length > 0));
            setSelectedElementId(null);
        }
    };

    const urlParams = useParams();
    const currentLocale = (urlParams?.locale as string) || 'tr';
    const { t } = useTranslation('modules/web-builder');

    return (
        <ThemeProvider>
            <DndContext onDragEnd={handleDragEnd}>
                <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
                    <CentralPageHeader
                        title={t('builder.title') || 'Page Builder'}
                        description={t('builder.description') || 'Build and customize your page'}
                        namespace="modules/web-builder"
                        icon={<IconCode size={32} />}
                        breadcrumbs={[
                            { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                            { label: 'builder.title', namespace: 'modules/web-builder' },
                        ]}
                    />
                    <div className="flex flex-1 overflow-hidden">
                        <BuilderToolbar />
                        <div className="flex-1 overflow-y-auto relative">
                        <BuilderCanvas
                            sections={sections}
                            onSelectElement={handleSelectElement}
                            selectedElementId={selectedElementId}
                        />

                        {/* Panel Toggle */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white p-2 rounded shadow-md">
                            <Tooltip label="Properties" position="left">
                                <ActionIcon
                                    variant={activePanel === 'properties' ? 'filled' : 'subtle'}
                                    onClick={() => setActivePanel('properties')}
                                >
                                    <IconSettings size={20} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Theme Settings" position="left">
                                <ActionIcon
                                    variant={activePanel === 'theme' ? 'filled' : 'subtle'}
                                    onClick={() => setActivePanel('theme')}
                                >
                                    <IconPalette size={20} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="SEO Settings" position="left">
                                <ActionIcon
                                    variant={activePanel === 'seo' ? 'filled' : 'subtle'}
                                    onClick={() => setActivePanel('seo')}
                                >
                                    <IconSeo size={20} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Preview" position="left">
                                <ActionIcon
                                    variant={showPreview ? 'filled' : 'subtle'}
                                    onClick={() => setShowPreview(!showPreview)}
                                >
                                    <IconEye size={20} />
                                </ActionIcon>
                            </Tooltip>
                        </div>
                    </div>

                    {showPreview ? (
                        <PagePreview
                            sections={sections}
                            pageTitle={seoSettings.metaTitle || 'Preview'}
                            onClose={() => setShowPreview(false)}
                        />
                    ) : activePanel === 'theme' ? (
                        <ThemeEditor />
                    ) : activePanel === 'seo' ? (
                        <div className="w-80 border-l bg-white p-4 h-full overflow-y-auto">
                            <Tabs defaultValue="settings">
                                <Tabs.List>
                                    <Tabs.Tab value="settings">Ayarlar</Tabs.Tab>
                                    <Tabs.Tab value="preview">Önizleme</Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="settings" pt="md">
                                    <SEOPanel
                                        settings={seoSettings}
                                        onChange={setSeoSettings}
                                    />
                                </Tabs.Panel>
                                <Tabs.Panel value="preview" pt="md">
                                    <SEOPreview
                                        settings={seoSettings}
                                        pageUrl={`https://example.com/${params.pageId}`}
                                    />
                                </Tabs.Panel>
                            </Tabs>
                        </div>
                    ) : (
                        <BuilderProperties
                            selectedElementId={selectedElementId}
                            sections={sections}
                            onDelete={handleDeleteElement}
                            seoSettings={seoSettings}
                            onSEOChange={setSeoSettings}
                            showSEO={false}
                        />
                    )}
                    </div>
                </div>
            </DndContext>
        </ThemeProvider>
    );
}
