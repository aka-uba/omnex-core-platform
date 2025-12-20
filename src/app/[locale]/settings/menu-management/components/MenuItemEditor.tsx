import { useState, useEffect } from 'react';
import {
    Modal,
    TextInput,
    Select,
    Switch,
    Button,
    Group,
    Stack,
    Tabs,
    Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconPickerButton } from '@/components/common/IconPicker';

interface MenuItem {
    id: string;
    label: any;
    href: string;
    icon?: string;
    target?: string;
    cssClass?: string;
    description?: any;
    visible: boolean;
    requiredRole?: string;
    requiredPermission?: string;
}

interface MenuItemEditorProps {
    opened: boolean;
    onClose: () => void;
    item: MenuItem | null;
    menuId: string;
    onUpdate: () => void;
    roles: { value: string; label: string }[];
}

export function MenuItemEditor({
    opened,
    onClose,
    item,
    menuId,
    onUpdate,
    roles
}: MenuItemEditorProps) {
    const { t } = useTranslation('modules/menu-management');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('general');

    const form = useForm({
        initialValues: {
            label: { tr: '', en: '' },
            href: '',
            icon: '',
            target: '_self',
            cssClass: '',
            description: { tr: '', en: '' },
            visible: true,
            requiredRole: '',
            requiredPermission: '',
        },
    });

    useEffect(() => {
        if (item) {
            form.setValues({
                label: typeof item.label === 'string' ? { tr: item.label, en: item.label } : { tr: item.label?.tr || '', en: item.label?.en || '' },
                href: item.href || '',
                icon: item.icon || '',
                target: item.target || '_self',
                cssClass: item.cssClass || '',
                description: typeof item.description === 'string' ? { tr: item.description, en: item.description } : { tr: item.description?.tr || '', en: item.description?.en || '' },
                visible: item.visible ?? true,
                requiredRole: item.requiredRole || '',
                requiredPermission: item.requiredPermission || '',
            });
        }
    }, [item]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!item) return;

        setIsSubmitting(true);
        try {
            const response = await fetchWithAuth(`/api/menus/${menuId}/items`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: item.id,
                    ...values
                }),
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('itemUpdated'),
                });
                // Trigger menu update event to refresh menus in sidebar/top/mobile
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('menu-updated'));
                }
                onUpdate();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('updateError'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={t('editMenuItem')}
            size="lg"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List mb="md">
                        <Tabs.Tab value="general">{t('general')}</Tabs.Tab>
                        <Tabs.Tab value="advanced">{t('advanced')}</Tabs.Tab>
                        <Tabs.Tab value="permissions">{t('permissions')}</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="general">
                        <Stack>
                            <Text size="sm" fw={500}>{t('label')}</Text>
                            <Group grow>
                                <TextInput
                                    label="Türkçe"
                                    placeholder="Menü adı"
                                    {...form.getInputProps('label.tr')}
                                />
                                <TextInput
                                    label="English"
                                    placeholder="Menu label"
                                    {...form.getInputProps('label.en')}
                                />
                            </Group>

                            <TextInput
                                label={t('url')}
                                placeholder="/example-page"
                                required
                                {...form.getInputProps('href')}
                            />

                            <IconPickerButton
                                label={t('icon')}
                                placeholder="İkon seçin..."
                                value={form.values.icon}
                                onChange={(iconName) => form.setFieldValue('icon', iconName)}
                            />

                            <Select
                                label={t('target')}
                                data={[
                                    { value: '_self', label: t('sameTab') },
                                    { value: '_blank', label: t('newTab') },
                                ]}
                                {...form.getInputProps('target')}
                            />
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="advanced">
                        <Stack>
                            <TextInput
                                label={t('cssClass')}
                                placeholder="custom-class"
                                {...form.getInputProps('cssClass')}
                            />

                            <Text size="sm" fw={500}>{t('descriptionLabel')}</Text>
                            <Group grow>
                                <TextInput
                                    label="Türkçe"
                                    placeholder="Açıklama"
                                    {...form.getInputProps('description.tr')}
                                />
                                <TextInput
                                    label="English"
                                    placeholder="Description"
                                    {...form.getInputProps('description.en')}
                                />
                            </Group>

                            <Switch
                                label={t('visible')}
                                {...form.getInputProps('visible', { type: 'checkbox' })}
                            />
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="permissions">
                        <Stack>
                            <Select
                                label={t('requiredRole')}
                                placeholder={t('selectRole')}
                                data={roles}
                                clearable
                                {...form.getInputProps('requiredRole')}
                            />

                            <TextInput
                                label={t('requiredPermission')}
                                placeholder="module.read"
                                {...form.getInputProps('requiredPermission')}
                            />
                        </Stack>
                    </Tabs.Panel>
                </Tabs>

                <Group justify="flex-end" mt="xl">
                    <Button variant="light" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit" loading={isSubmitting}>{t('save')}</Button>
                </Group>
            </form>
        </Modal>
    );
}
