import { useState, useEffect } from 'react';
import {
    Paper,
    Title,
    Button,
    Stack,
    Group,
    Accordion,
    Checkbox,
    ScrollArea,
    TextInput
} from '@mantine/core';
// import { IconSearch, IconPlus } from '@tabler/icons-react'; // removed - unused
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useParams } from 'next/navigation';

interface PageItem {
    id: string;
    title: string;
    url: string;
    type: 'page' | 'module' | 'custom' | 'submodule';
    children?: PageItem[];
}

interface PageSelectorProps {
    menuId: string;
    onItemsAdded: () => void;
}

export function PageSelector({ menuId, onItemsAdded }: PageSelectorProps) {
    const { t } = useTranslation('modules/menu-management');
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const [pages, setPages] = useState<PageItem[]>([]);
    const [modules, setModules] = useState<PageItem[]>([]);
    const [selectedPages, setSelectedPages] = useState<string[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [, setIsLoading] = useState(true);
    const [customLink, setCustomLink] = useState({ label: '', url: '' });

    useEffect(() => {
        fetchPages();
    }, [locale]);

    const fetchPages = async () => {
        try {
            const response = await fetchWithAuth(`/api/menu-management/available-pages?locale=${locale}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch pages: ${response.status}`);
            }
            const result = await response.json();
            if (result.success && result.data) {
                // Transform categories into flat pages and hierarchical modules arrays
                const allPages: PageItem[] = [];
                const moduleMap = new Map<string, PageItem>();
                const settingsPages: PageItem[] = [];

                result.data.categories?.forEach((category: any) => {
                    // If this category is a module category (id starts with 'module-')
                    if (category.id?.startsWith('module-')) {
                        const moduleSlug = category.id.replace('module-', '');
                        let mainModule: PageItem | null = null;

                        // Find dashboard page first
                        const dashboardPage = category.pages?.find((p: any) => 
                            p.href === `/modules/${moduleSlug}/dashboard` || p.href === `/modules/${moduleSlug}`
                        );
                        
                        // Create main module with dashboard or first page
                        const firstPage = dashboardPage || category.pages?.[0];
                        if (firstPage) {
                            mainModule = {
                                id: `module-${moduleSlug}`,
                                title: category.label || moduleSlug,
                                url: `/modules/${moduleSlug}`,
                                type: 'module',
                                children: [],
                            };
                            moduleMap.set(moduleSlug, mainModule);
                        }
                        
                        // Build hierarchical structure from flat pages with parentId
                        const pageMap = new Map<string, PageItem>();
                        
                        // First pass: Create all page items
                        category.pages?.forEach((page: any) => {
                            const pageItem: PageItem = {
                                id: page.id,
                                title: page.label,
                                url: page.href,
                                type: 'submodule',
                                children: [],
                            };
                            pageMap.set(page.id, pageItem);
                        });
                        
                        // Second pass: Build hierarchy - only add root-level pages to mainModule
                        // Children will be added to their parents
                        category.pages?.forEach((page: any) => {
                            const pageItem = pageMap.get(page.id);
                            if (!pageItem) return;
                            
                            if (page.parentId) {
                                // This is a child page - add to its parent
                                const parentItem = pageMap.get(page.parentId);
                                if (parentItem) {
                                    if (!parentItem.children) {
                                        parentItem.children = [];
                                    }
                                    parentItem.children.push(pageItem);
                                }
                                // If parent not found, skip it (parent will be added separately)
                            } else {
                                // This is a root-level page, add to main module
                                if (mainModule) {
                                    if (!mainModule.children) {
                                        mainModule.children = [];
                                    }
                                    mainModule.children.push(pageItem);
                                } else {
                                    // Fallback: create module if not exists
                                    mainModule = {
                                        id: `module-${moduleSlug}`,
                                        title: category.label || moduleSlug,
                                        url: `/modules/${moduleSlug}`,
                                        type: 'module',
                                        children: [pageItem],
                                    };
                                    moduleMap.set(moduleSlug, mainModule);
                                }
                            }
                        });

                    } else if (category.id === 'settings') {
                        // Settings pages - add as standalone pages
                        category.pages?.forEach((page: any) => {
                            const pageItem: PageItem = {
                                id: page.id,
                                title: page.label,
                                url: page.href,
                                type: 'page',
                                children: [],
                            };
                            settingsPages.push(pageItem);
                        });
                    } else {
                        // Core, superadmin, etc. pages
                        category.pages?.forEach((page: any) => {
                            const pageItem: PageItem = {
                                id: page.id,
                                title: page.label,
                                url: page.href,
                                type: 'page',
                            };
                            allPages.push(pageItem);
                        });
                    }
                });

                // Add all settings pages
                allPages.push(...settingsPages);

                // Convert module map to array
                const allModules = Array.from(moduleMap.values());

                setPages(allPages);
                setModules(allModules);
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
            showToast({
                type: 'error',
                title: t('error'),
                message: t('fetchLocationsError'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get translations for all locales
    // Use current locale's label for current locale, empty for others (user can edit later)
    const getTranslationsForAllLocales = (label: string): Record<string, string> => {
        const locales: Array<'tr' | 'en' | 'de' | 'ar'> = ['tr', 'en', 'de', 'ar'];
        const translations: Record<string, string> = {};
        
        // Use current label only for current locale, empty for others (user can edit later)
        for (const loc of locales) {
            translations[loc] = loc === locale ? label : '';
        }
        
        return translations;
    };

    const addItemToMenu = async (label: string, href: string, group: string, moduleSlug?: string, parentId?: string, pageKey?: string) => {
        // Get translations for all locales (using current label for all, user can edit later)
        const translations = getTranslationsForAllLocales(label);
        
        const response = await fetchWithAuth(`/api/menus/${menuId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                label: translations, // All locales
                href,
                menuGroup: group,
                moduleSlug: moduleSlug || null,
                parentId: parentId || null,
                visible: true,
                order: 999, // Will be added to end
            }),
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to add item');
        }
        return data;
    };

    const handleAddPages = async () => {
        if (selectedPages.length === 0) return;

        setIsAdding(true);
        try {
            // Add each selected page
            for (const pageId of selectedPages) {
                const page = pages.find(p => p.id === pageId);
                if (page) {
                    await addItemToMenu(page.title, page.url, 'page');
                }
            }

            showToast({
                type: 'success',
                title: t('success'),
                message: t('itemsAdded'),
            });
            setSelectedPages([]);
            onItemsAdded();
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: t('addError'),
            });
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddModules = async () => {
        if (selectedModules.length === 0) return;

        setIsAdding(true);
        try {
            // Helper to find module recursively
            const findModule = (items: PageItem[], id: string): PageItem | undefined => {
                for (const item of items) {
                    if (item.id === id) return item;
                    if (item.children) {
                        const found = findModule(item.children, id);
                        if (found) return found;
                    }
                }
                return undefined;
            };

            // Add modules hierarchically: parent first, then ALL children with parentId
            const processedModules = new Map<string, string>(); // Track processed parent modules: modId -> parentItemId
            const addedItems = new Set<string>(); // Track added items to avoid duplicates
            
            // First pass: Add parent modules only (modules that are not children of other selected modules)
            for (const modId of selectedModules) {
                const mod = findModule(modules, modId);
                if (!mod) continue;
                
                // Check if this is a child of another selected module
                let isChild = false;
                for (const otherModId of selectedModules) {
                    if (otherModId === modId) continue;
                    const otherMod = findModule(modules, otherModId);
                    if (otherMod?.children && findModule(otherMod.children, modId)) {
                        isChild = true;
                        break;
                    }
                }
                
                // If it's a child, skip it in first pass - it will be added with parentId in second pass
                if (isChild) continue;
                
                // Extract module slug from URL if available
                const moduleSlug = mod.url.split('/').filter(Boolean).find((part, idx, arr) => 
                    idx > 0 && arr[idx - 1] === 'modules'
                );
                
                // Add parent module first
                const parentResponse = await addItemToMenu(mod.title, mod.url, 'module', moduleSlug);
                if (parentResponse?.success && parentResponse?.data?.id) {
                    const parentId = parentResponse.data.id;
                    processedModules.set(modId, parentId);
                    addedItems.add(modId);
                }
            }
            
            // Helper to add children recursively with proper hierarchy
            const addChildrenRecursively = async (parentItem: PageItem, parentItemId: string) => {
                if (!parentItem.children) return;
                
                for (const child of parentItem.children) {
                    // Skip if already added
                    if (addedItems.has(child.id)) continue;
                    
                    // Only add if child is selected OR parent is selected (to maintain hierarchy)
                    const isChildSelected = selectedModules.includes(child.id);
                    const isParentSelected = selectedModules.includes(parentItem.id);
                    
                    if (isChildSelected || isParentSelected) {
                        const moduleSlug = child.url.split('/').filter(Boolean).find((part, idx, arr) => 
                            idx > 0 && arr[idx - 1] === 'modules'
                        );
                        const childResponse = await addItemToMenu(child.title, child.url, 'module', moduleSlug, parentItemId);
                        if (childResponse?.success && childResponse?.data?.id) {
                            addedItems.add(child.id);
                            const childItemId = childResponse.data.id;
                            
                            // Recursively add grandchildren
                            await addChildrenRecursively(child, childItemId);
                        }
                    }
                }
            };
            
            // Second pass: Add ALL children of processed parent modules with parentId (recursively)
            for (const [parentModId, parentItemId] of processedModules.entries()) {
                const parentMod = findModule(modules, parentModId);
                if (!parentMod) continue;
                
                await addChildrenRecursively(parentMod, parentItemId);
            }
            
            // Third pass: Add any remaining selected items that are children of other selected modules
            for (const modId of selectedModules) {
                if (addedItems.has(modId)) continue; // Already added
                
                const mod = findModule(modules, modId);
                if (!mod) continue;
                
                // Find parent module
                let parentId: string | undefined;
                for (const [parentModId, parentItemId] of processedModules.entries()) {
                    const parentMod = findModule(modules, parentModId);
                    if (parentMod?.children && findModule(parentMod.children, modId)) {
                        parentId = parentItemId;
                        break;
                    }
                }
                
                // If this is a child, add it with parentId
                if (parentId) {
                    const moduleSlug = mod.url.split('/').filter(Boolean).find((part, idx, arr) => 
                        idx > 0 && arr[idx - 1] === 'modules'
                    );
                    await addItemToMenu(mod.title, mod.url, 'module', moduleSlug, parentId);
                    addedItems.add(modId);
                }
            }

            showToast({
                type: 'success',
                title: t('success'),
                message: t('itemsAdded'),
            });
            setSelectedModules([]);
            onItemsAdded();
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: t('addError'),
            });
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddCustomLink = async () => {
        if (!customLink.label || !customLink.url) return;

        setIsAdding(true);
        try {
            await addItemToMenu(customLink.label, customLink.url, 'custom');

            showToast({
                type: 'success',
                title: t('success'),
                message: t('itemAdded'),
            });
            setCustomLink({ label: '', url: '' });
            onItemsAdded();
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: t('addError'),
            });
        } finally {
            setIsAdding(false);
        }
    };

    // ... (handleAddCustomLink and addItemToMenu remain same)

    // Helper to get all child IDs recursively
    const getAllChildIds = (item: PageItem): string[] => {
        const ids = [item.id];
        if (item.children) {
            item.children.forEach(child => {
                ids.push(...getAllChildIds(child));
            });
        }
        return ids;
    };

    const renderModuleItem = (item: PageItem, level = 0, showParent = true) => {
        const allChildIds = getAllChildIds(item);
        const isParentSelected = selectedModules.includes(item.id);
        const allChildrenSelected = item.children ? item.children.every(child => selectedModules.includes(child.id)) : true;

        return (
            <div key={item.id}>
                {showParent && (
                    <div style={{ marginLeft: level * 20 }}>
                        <Checkbox
                            label={item.title}
                            checked={isParentSelected}
                            {...((!isParentSelected && allChildrenSelected && item.children && item.children.length > 0 && selectedModules.some(id => allChildIds.includes(id))) ? { indeterminate: true } : {})}
                            onChange={(e) => {
                                if (e.currentTarget.checked) {
                                    // Select parent and all children
                                    setSelectedModules(prev => {
                                        const newSet = new Set(prev);
                                        allChildIds.forEach(id => newSet.add(id));
                                        return Array.from(newSet);
                                    });
                                } else {
                                    // Deselect parent and all children
                                    setSelectedModules(prev => prev.filter(id => !allChildIds.includes(id)));
                                }
                            }}
                            mb={4}
                        />
                    </div>
                )}
                {item.children && (
                    <Stack gap={4} mt={showParent ? 4 : 0}>
                        {item.children.map(child => renderModuleItem(child, level + 1, true))}
                    </Stack>
                )}
            </div>
        );
    };

    return (
        <Paper p="md" withBorder>
            <Title order={5} mb="md">{t('addMenuItems')}</Title>

            <Accordion variant="contained">
                <Accordion.Item value="pages">
                    <Accordion.Control>{t('pages')}</Accordion.Control>
                    <Accordion.Panel>
                        <ScrollArea h={200}>
                            <Stack gap="xs">
                                {pages.map(page => (
                                    <Checkbox
                                        key={page.id}
                                        label={page.title}
                                        checked={selectedPages.includes(page.id)}
                                        onChange={(e) => {
                                            if (e.currentTarget.checked) {
                                                setSelectedPages([...selectedPages, page.id]);
                                            } else {
                                                setSelectedPages(selectedPages.filter(id => id !== page.id));
                                            }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </ScrollArea>
                        <Group justify="flex-end" mt="sm">
                            <Button
                                size="xs"
                                onClick={handleAddPages}
                                loading={isAdding}
                                disabled={selectedPages.length === 0}
                            >
                                {t('addToMenu')}
                            </Button>
                        </Group>
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="modules">
                    <Accordion.Control>{t('modules')}</Accordion.Control>
                    <Accordion.Panel>
                        <ScrollArea h={300}>
                            <Stack gap="xs">
                                {modules.map(mod => renderModuleItem(mod, 0, true))}
                            </Stack>
                        </ScrollArea>
                        <Group justify="flex-end" mt="sm">
                            <Button
                                size="xs"
                                onClick={handleAddModules}
                                loading={isAdding}
                                disabled={selectedModules.length === 0}
                            >
                                {t('addToMenu')}
                            </Button>
                        </Group>
                    </Accordion.Panel>
                </Accordion.Item>


                <Accordion.Item value="custom">
                    <Accordion.Control>{t('customLinks')}</Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="sm">
                            <TextInput
                                label={t('url')}
                                placeholder="https://"
                                value={customLink.url}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomLink({ ...customLink, url: e.currentTarget.value })}
                            />
                            <TextInput
                                label={t('linkText')}
                                placeholder={t('menuText')}
                                value={customLink.label}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomLink({ ...customLink, label: e.currentTarget.value })}
                            />
                            <Group justify="flex-end">
                                <Button
                                    size="xs"
                                    onClick={handleAddCustomLink}
                                    loading={isAdding}
                                    disabled={!customLink.label || !customLink.url}
                                >
                                    {t('addToMenu')}
                                </Button>
                            </Group>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Paper>
    );
}
