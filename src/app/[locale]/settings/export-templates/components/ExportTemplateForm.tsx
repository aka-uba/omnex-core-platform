'use client';

import { useState } from 'react';
import {
    Container,
    Paper,
    TextInput,
    Select,
    FileInput,
    Textarea,
    Button,
    Group,
    Stack,
    Switch,
    Title,
    Text,
    Image,
    ActionIcon,
    Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPhoto, IconPlus, IconTrash, IconBuilding, IconMapPin } from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';
import { useQuery } from '@tanstack/react-query';

interface LogoItem {
    id: string;
    url?: string;
    file?: File;
    position?: 'left' | 'center' | 'right';
}

interface HeaderItem {
    id: string;
    text: string;
    position?: 'left' | 'center' | 'right';
}

interface FooterItem {
    id: string;
    text: string;
    position?: 'left' | 'center' | 'right';
}

interface ExportTemplateFormData {
    name: string;
    type: 'header' | 'footer' | 'full';
    companyId?: string | null;
    locationId?: string | null;
    logos: LogoItem[];
    headers: HeaderItem[];
    footers: FooterItem[];
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxNumber?: string;
    isDefault: boolean;
    isActive: boolean;
}

interface ExportTemplateFormProps {
    initialData?: Partial<ExportTemplateFormData>;
    onSubmit: (data: ExportTemplateFormData) => Promise<void>;
    onCancel: () => void;
    isEdit?: boolean;
}

export function ExportTemplateForm({
    initialData,
    onSubmit,
    onCancel,
    isEdit = false,
}: ExportTemplateFormProps) {
    const { t } = useTranslation('modules/export-templates');
    const [loading, setLoading] = useState(false);

    // Fetch companies and locations
    const { data: companiesData } = useQuery({
        queryKey: ['companies'],
        queryFn: async () => {
            const response = await fetch('/api/companies?page=1&pageSize=1000');
            if (!response.ok) throw new Error('Failed to fetch companies');
            const result = await response.json();
            return result.data?.companies || [];
        },
    });

    const { data: locationsData } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const response = await fetch('/api/locations?page=1&pageSize=1000');
            if (!response.ok) throw new Error('Failed to fetch locations');
            const result = await response.json();
            return result.data?.locations || [];
        },
    });

    const form = useForm<ExportTemplateFormData>({
        initialValues: {
            name: initialData?.name || '',
            type: initialData?.type || 'full',
            companyId: initialData?.companyId || null,
            locationId: initialData?.locationId || null,
            logos: initialData?.logos || [],
            headers: initialData?.headers || [],
            footers: initialData?.footers || [],
            address: initialData?.address || '',
            phone: initialData?.phone || '',
            email: initialData?.email || '',
            website: initialData?.website || '',
            taxNumber: initialData?.taxNumber || '',
            isDefault: initialData?.isDefault || false,
            isActive: initialData?.isActive ?? true,
        },
        validate: {
            name: (value) => (value ? null : t('validation.nameRequired')),
            type: (value) => (value ? null : t('validation.typeRequired')),
        },
    });

    const addLogo = () => {
        form.insertListItem('logos', {
            id: `logo-${Date.now()}`,
            position: 'left',
        });
    };

    const removeLogo = (index: number) => {
        form.removeListItem('logos', index);
    };

    const addHeader = () => {
        form.insertListItem('headers', {
            id: `header-${Date.now()}`,
            text: '',
            position: 'left',
        });
    };

    const removeHeader = (index: number) => {
        form.removeListItem('headers', index);
    };

    const addFooter = () => {
        form.insertListItem('footers', {
            id: `footer-${Date.now()}`,
            text: '',
            position: 'left',
        });
    };

    const removeFooter = (index: number) => {
        form.removeListItem('footers', index);
    };

    const handleLogoFileChange = (index: number, file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const logos = [...form.values.logos];
                const currentLogo = logos[index];
                logos[index] = {
                    id: currentLogo?.id || `logo-${index}`,
                    ...(currentLogo?.position ? { position: currentLogo.position } : {}),
                    url: reader.result as string,
                    file: file,
                };
                form.setFieldValue('logos', logos);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (values: ExportTemplateFormData) => {
        try {
            setLoading(true);

            // Convert form data to templateData format
            const templateData = {
                logoUrl: values.logos.length > 0 ? values.logos[0]?.url : undefined,
                title: values.headers.length > 0 ? values.headers[0]?.text : undefined,
                subtitle: values.headers.length > 1 ? values.headers[1]?.text : undefined,
                address: values.address,
                phone: values.phone,
                email: values.email,
                website: values.website,
                taxNumber: values.taxNumber,
                customFields: {
                    logos: values.logos.map(logo => ({
                        url: logo.url,
                        position: logo.position,
                    })),
                    headers: values.headers.map(header => ({
                        text: header.text,
                        position: header.position,
                    })),
                    footers: values.footers.map(footer => ({
                        text: footer.text,
                        position: footer.position,
                    })),
                },
            };

            await onSubmit({
                ...values,
                templateData,
            } as any);
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('notifications.error'),
                message: error.message || t('notifications.submitError'),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="lg">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Paper p="md" withBorder>
                        <Title order={4} mb="md">
                            {t('form.basicInfo')}
                        </Title>

                        <Stack>
                            <TextInput
                                label={t('form.name')}
                                placeholder={t('form.namePlaceholder')}
                                required
                                {...form.getInputProps('name')}
                            />

                            <Select
                                label={t('form.type')}
                                placeholder={t('form.typePlaceholder')}
                                required
                                data={[
                                    { value: 'header', label: t('types.header') },
                                    { value: 'footer', label: t('types.footer') },
                                    { value: 'full', label: t('types.full') },
                                ]}
                                {...form.getInputProps('type')}
                            />

                            <Group grow>
                                <Select
                                    label={t('form.company')}
                                    placeholder={t('form.companyPlaceholder')}
                                    data={companiesData?.map((c: any) => ({ value: c.id, label: c.name })) || []}
                                    leftSection={<IconBuilding size={16} />}
                                    clearable
                                    {...form.getInputProps('companyId')}
                                />

                                <Select
                                    label={t('form.location')}
                                    placeholder={t('form.locationPlaceholder')}
                                    data={locationsData?.map((l: any) => ({ value: l.id, label: l.name })) || []}
                                    leftSection={<IconMapPin size={16} />}
                                    clearable
                                    {...form.getInputProps('locationId')}
                                />
                            </Group>

                            <Group grow>
                                <Switch
                                    label={t('form.isDefault')}
                                    description={t('form.isDefaultDesc')}
                                    {...form.getInputProps('isDefault', { type: 'checkbox' })}
                                />

                                <Switch
                                    label={t('form.isActive')}
                                    description={t('form.isActiveDesc')}
                                    {...form.getInputProps('isActive', { type: 'checkbox' })}
                                />
                            </Group>
                        </Stack>
                    </Paper>

                    <Paper p="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={4}>{t('form.logos')}</Title>
                            <Button
                                size="xs"
                                leftSection={<IconPlus size={14} />}
                                onClick={addLogo}
                                variant="light"
                            >
                                {t('form.addLogo')}
                            </Button>
                        </Group>

                        <Stack gap="md">
                            {form.values.logos.map((logo, index) => (
                                <Paper key={logo.id} p="sm" withBorder>
                                    <Group justify="space-between" mb="sm">
                                        <Badge>{t('form.logo')} {index + 1}</Badge>
                                        <ActionIcon
                                            color="red"
                                            variant="light"
                                            onClick={() => removeLogo(index)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                    <Stack gap="sm">
                                        <FileInput
                                            label={t('form.logoFile')}
                                            placeholder={t('form.logoFilePlaceholder')}
                                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                            leftSection={<IconPhoto size={16} />}
                                            onChange={(file) => handleLogoFileChange(index, file)}
                                        />
                                        {logo.url && (
                                            <Image src={logo.url} alt="Logo preview" w={100} h={100} fit="contain" />
                                        )}
                                        <Select
                                            label={t('form.position')}
                                            data={[
                                                { value: 'left', label: t('form.positionLeft') },
                                                { value: 'center', label: t('form.positionCenter') },
                                                { value: 'right', label: t('form.positionRight') },
                                            ]}
                                            {...form.getInputProps(`logos.${index}.position`)}
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                            {form.values.logos.length === 0 && (
                                <Text size="sm" c="dimmed" ta="center" py="md">
                                    {t('form.noLogos')}
                                </Text>
                            )}
                        </Stack>
                    </Paper>

                    <Paper p="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={4}>{t('form.headers')}</Title>
                            <Button
                                size="xs"
                                leftSection={<IconPlus size={14} />}
                                onClick={addHeader}
                                variant="light"
                            >
                                {t('form.addHeader')}
                            </Button>
                        </Group>

                        <Stack gap="md">
                            {form.values.headers.map((header, index) => (
                                <Paper key={header.id} p="sm" withBorder>
                                    <Group justify="space-between" mb="sm">
                                        <Badge>{t('form.header')} {index + 1}</Badge>
                                        <ActionIcon
                                            color="red"
                                            variant="light"
                                            onClick={() => removeHeader(index)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                    <Stack gap="sm">
                                        <TextInput
                                            label={t('form.headerText')}
                                            placeholder={t('form.headerTextPlaceholder')}
                                            {...form.getInputProps(`headers.${index}.text`)}
                                        />
                                        <Select
                                            label={t('form.position')}
                                            data={[
                                                { value: 'left', label: t('form.positionLeft') },
                                                { value: 'center', label: t('form.positionCenter') },
                                                { value: 'right', label: t('form.positionRight') },
                                            ]}
                                            {...form.getInputProps(`headers.${index}.position`)}
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                            {form.values.headers.length === 0 && (
                                <Text size="sm" c="dimmed" ta="center" py="md">
                                    {t('form.noHeaders')}
                                </Text>
                            )}
                        </Stack>
                    </Paper>

                    <Paper p="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={4}>{t('form.footers')}</Title>
                            <Button
                                size="xs"
                                leftSection={<IconPlus size={14} />}
                                onClick={addFooter}
                                variant="light"
                            >
                                {t('form.addFooter')}
                            </Button>
                        </Group>

                        <Stack gap="md">
                            {form.values.footers.map((footer, index) => (
                                <Paper key={footer.id} p="sm" withBorder>
                                    <Group justify="space-between" mb="sm">
                                        <Badge>{t('form.footer')} {index + 1}</Badge>
                                        <ActionIcon
                                            color="red"
                                            variant="light"
                                            onClick={() => removeFooter(index)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                    <Stack gap="sm">
                                        <Textarea
                                            label={t('form.footerText')}
                                            placeholder={t('form.footerTextPlaceholder')}
                                            rows={2}
                                            {...form.getInputProps(`footers.${index}.text`)}
                                        />
                                        <Select
                                            label={t('form.position')}
                                            data={[
                                                { value: 'left', label: t('form.positionLeft') },
                                                { value: 'center', label: t('form.positionCenter') },
                                                { value: 'right', label: t('form.positionRight') },
                                            ]}
                                            {...form.getInputProps(`footers.${index}.position`)}
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                            {form.values.footers.length === 0 && (
                                <Text size="sm" c="dimmed" ta="center" py="md">
                                    {t('form.noFooters')}
                                </Text>
                            )}
                        </Stack>
                    </Paper>

                    <Paper p="md" withBorder>
                        <Title order={4} mb="md">
                            {t('form.contactInfo')}
                        </Title>

                        <Stack>
                            <Textarea
                                label={t('form.address')}
                                placeholder={t('form.addressPlaceholder')}
                                rows={2}
                                {...form.getInputProps('address')}
                            />

                            <Group grow>
                                <TextInput
                                    label={t('form.phone')}
                                    placeholder="+90 555 123 4567"
                                    {...form.getInputProps('phone')}
                                />

                                <TextInput
                                    label={t('form.email')}
                                    placeholder="info@firma.com"
                                    type="email"
                                    {...form.getInputProps('email')}
                                />
                            </Group>

                            <Group grow>
                                <TextInput
                                    label={t('form.website')}
                                    placeholder="https://firma.com"
                                    {...form.getInputProps('website')}
                                />

                                <TextInput
                                    label={t('form.taxNumber')}
                                    placeholder="123-456-789"
                                    {...form.getInputProps('taxNumber')}
                                />
                            </Group>
                        </Stack>
                    </Paper>

                    <Group justify="flex-end">
                        <Button variant="default" onClick={onCancel} disabled={loading}>
                            {t('form.cancel')}
                        </Button>
                        <Button type="submit" loading={loading}>
                            {isEdit ? t('form.update') : t('form.create')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Container>
    );
}
