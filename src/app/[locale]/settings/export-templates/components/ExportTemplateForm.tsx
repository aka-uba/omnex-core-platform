'use client';

import { useState, useCallback } from 'react';
import {
    Container,
    Paper,
    TextInput,
    Select,
    Textarea,
    Button,
    Group,
    Stack,
    Switch,
    Title,
    Text,
    Image,
    ActionIcon,
    Grid,
    Box,
    Divider,
    Center,
    Table,
    Code,
    Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBuilding, IconMapPin, IconRefresh, IconInfoCircle } from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { SectionEditor } from './SectionEditor';
import type { TemplateSection, SectionItem } from '@/lib/export/types';

interface CompanyData {
    id: string;
    name: string;
    logo?: string;
    logoFile?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxNumber?: string;
    taxOffice?: string;
}

interface ExportTemplateFormData {
    name: string;
    type: 'header' | 'footer' | 'full';
    companyId?: string | null;
    locationId?: string | null;
    headerSections: TemplateSection[];
    footerSections: TemplateSection[];
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

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Placeholder Info Table Component
function PlaceholderInfoTable({ t }: { t: (key: string) => string }) {
    const placeholders = [
        { code: '{{pageTitle}}', key: 'pageTitle' },
        { code: '{{companyName}}', key: 'companyName' },
        { code: '{{companyAddress}}', key: 'companyAddress' },
        { code: '{{companyPhone}}', key: 'companyPhone' },
        { code: '{{companyEmail}}', key: 'companyEmail' },
        { code: '{{companyWebsite}}', key: 'companyWebsite' },
        { code: '{{companyTaxId}}', key: 'companyTaxId' },
        { code: '{{companyLogo}}', key: 'companyLogo' },
        { code: '{{date}}', key: 'date' },
        { code: '{{year}}', key: 'year' },
    ];

    return (
        <Paper p="md" withBorder>
            <Group gap="xs" mb="sm">
                <IconInfoCircle size={20} color="var(--mantine-color-blue-6)" />
                <Title order={5}>{t('placeholders.title')}</Title>
            </Group>
            <Text size="sm" c="dimmed" mb="xs">
                {t('placeholders.description')}
            </Text>
            <Alert variant="light" color="blue" mb="md" p="xs">
                <Text size="xs">
                    <Code>{t('placeholders.example')}</Code>
                </Text>
            </Alert>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>{t('placeholders.placeholder')}</Table.Th>
                        <Table.Th>{t('placeholders.value')}</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {placeholders.map((item) => (
                        <Table.Tr key={item.code}>
                            <Table.Td>
                                <Code>{item.code}</Code>
                            </Table.Td>
                            <Table.Td>
                                <Text size="sm">{t(`placeholders.items.${item.key}`)}</Text>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Paper>
    );
}

// Template Preview Component with Grid Support
function TemplatePreview({
    formValues,
    templateType,
    t
}: {
    formValues: ExportTemplateFormData;
    templateType: 'header' | 'footer' | 'full';
    t: (key: string) => string;
}) {
    const renderSectionItem = (item: SectionItem) => {
        switch (item.type) {
            case 'logo':
                return item.logoUrl ? (
                    <Image
                        src={item.logoUrl}
                        alt="Logo"
                        h={40}
                        w="auto"
                        fit="contain"
                        style={{ display: 'inline-block' }}
                    />
                ) : (
                    <Box
                        style={{
                            width: 60,
                            height: 40,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Text size="xs" c="dimmed">Logo</Text>
                    </Box>
                );
            case 'text':
            case 'variable':
                return (
                    <Text
                        size="sm"
                        fw={item.fontWeight === 'bold' ? 700 : 400}
                        style={{ textAlign: item.textAlign || 'center' }}
                    >
                        {item.value || (item.type === 'variable' ? '{{...}}' : 'Metin')}
                    </Text>
                );
            case 'divider':
                return <Divider my={4} />;
            case 'spacer':
                return <Box h={16} />;
            default:
                return null;
        }
    };

    const renderSection = (section: TemplateSection) => {
        const columnCount = section.columns.length;
        return (
            <Box key={section.id} style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
                {section.columns.map((column) => (
                    <Box
                        key={column.id}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: column.verticalAlign === 'bottom' ? 'flex-end' :
                                       column.verticalAlign === 'middle' ? 'center' : 'flex-start',
                            justifyContent: columnCount === 1 ? 'center' : 'flex-start',
                        }}
                    >
                        {column.items.map((item) => (
                            <Box key={item.id} style={{ width: '100%', textAlign: item.textAlign || 'center' }}>
                                {renderSectionItem(item)}
                            </Box>
                        ))}
                    </Box>
                ))}
            </Box>
        );
    };

    const renderHeader = () => (
        <Box p="sm" style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
            {formValues.headerSections.length > 0 ? (
                formValues.headerSections.map(renderSection)
            ) : (
                <Text size="xs" c="dimmed" ta="center">
                    {t('preview.noHeaderSections')}
                </Text>
            )}
            {/* Contact Info */}
            {(formValues.address || formValues.phone || formValues.email) && (
                <Group gap="md" mt="xs" justify="center">
                    {formValues.address && <Text size="xs" c="dimmed">{formValues.address}</Text>}
                    {formValues.phone && <Text size="xs" c="dimmed">{formValues.phone}</Text>}
                    {formValues.email && <Text size="xs" c="dimmed">{formValues.email}</Text>}
                </Group>
            )}
        </Box>
    );

    const renderFooter = () => (
        <Box p="sm" style={{ borderTop: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
            {formValues.footerSections.length > 0 ? (
                formValues.footerSections.map(renderSection)
            ) : (
                <Text size="xs" c="dimmed" ta="center">
                    {t('preview.noFooterSections')}
                </Text>
            )}
            {(formValues.website || formValues.taxNumber) && (
                <Group gap="md" mt="xs" justify="center">
                    {formValues.website && <Text size="xs" c="dimmed">{formValues.website}</Text>}
                    {formValues.taxNumber && <Text size="xs" c="dimmed">VKN: {formValues.taxNumber}</Text>}
                </Group>
            )}
        </Box>
    );

    const renderContent = () => (
        <Box p="md" style={{ minHeight: 80, backgroundColor: '#fff' }}>
            <Text size="sm" c="dimmed" ta="center" py="md">
                {t('preview.sampleContent')}
            </Text>
            <Box style={{ border: '1px dashed #ccc', borderRadius: 4, padding: 12, margin: '0 auto', maxWidth: 350 }}>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed">Column 1</Text>
                        <Text size="xs" c="dimmed">Column 2</Text>
                        <Text size="xs" c="dimmed">Column 3</Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                        <Text size="xs">Data 1</Text>
                        <Text size="xs">Data 2</Text>
                        <Text size="xs">Data 3</Text>
                    </Group>
                </Stack>
            </Box>
        </Box>
    );

    const isEmpty = formValues.headerSections.length === 0 &&
                    formValues.footerSections.length === 0 &&
                    !formValues.address && !formValues.phone && !formValues.email &&
                    !formValues.website && !formValues.taxNumber;

    if (isEmpty) {
        return (
            <Center h={200}>
                <Stack align="center" gap="xs">
                    <Text size="sm" c="dimmed">{t('preview.empty')}</Text>
                    <Text size="xs" c="dimmed">{t('preview.emptyHint')}</Text>
                </Stack>
            </Center>
        );
    }

    return (
        <Box style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }}>
            {(templateType === 'header' || templateType === 'full') && renderHeader()}
            {templateType === 'full' && renderContent()}
            {(templateType === 'footer' || templateType === 'full') && renderFooter()}
        </Box>
    );
}

export function ExportTemplateForm({
    initialData,
    onSubmit,
    onCancel,
    isEdit = false,
}: ExportTemplateFormProps) {
    const { t } = useTranslation('modules/export-templates');
    const [loading, setLoading] = useState(false);
    const [autoFillLoading, setAutoFillLoading] = useState(false);

    // Fetch companies and locations
    const { data: companiesData } = useQuery<CompanyData[]>({
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
            headerSections: initialData?.headerSections || [],
            footerSections: initialData?.footerSections || [],
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

    // Auto-fill form when company is selected
    const fillFromCompany = useCallback((companyId: string | null) => {
        if (!companyId || !companiesData) return;

        const company = companiesData.find((c: CompanyData) => c.id === companyId);
        if (!company) return;

        setAutoFillLoading(true);

        // Build full address
        const addressParts = [
            company.address,
            company.city,
            company.state,
            company.postalCode,
            company.country
        ].filter(Boolean);
        const fullAddress = addressParts.join(', ');

        // Create default header section with logo and company name
        if (form.values.headerSections.length === 0) {
            const defaultSection: TemplateSection = {
                id: generateId(),
                columns: [
                    {
                        id: generateId(),
                        items: company.logo || company.logoFile ? [{
                            id: generateId(),
                            type: 'logo',
                            logoUrl: company.logo || company.logoFile,
                        }] : [],
                    },
                    {
                        id: generateId(),
                        items: [{
                            id: generateId(),
                            type: 'text',
                            value: company.name,
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }],
                    },
                    {
                        id: generateId(),
                        items: [{
                            id: generateId(),
                            type: 'variable',
                            value: '{{date}}',
                            textAlign: 'right',
                        }],
                    },
                ],
            };
            form.setFieldValue('headerSections', [defaultSection]);
        }

        // Fill contact info
        if (fullAddress) form.setFieldValue('address', fullAddress);
        if (company.phone) form.setFieldValue('phone', company.phone);
        if (company.email) form.setFieldValue('email', company.email);
        if (company.website) form.setFieldValue('website', company.website);
        if (company.taxNumber) form.setFieldValue('taxNumber', company.taxNumber);

        setAutoFillLoading(false);

        showToast({
            type: 'success',
            title: t('notifications.autoFilled'),
            message: t('notifications.autoFilledDesc'),
        });
    }, [companiesData, form, t]);

    // Handle company selection change
    const handleCompanyChange = (value: string | null) => {
        form.setFieldValue('companyId', value);
        if (!isEdit && value) {
            fillFromCompany(value);
        }
    };

    const handleSubmit = async (values: ExportTemplateFormData) => {
        try {
            setLoading(true);

            // Convert form data to templateData format for API
            const templateData = {
                address: values.address,
                phone: values.phone,
                email: values.email,
                website: values.website,
                taxNumber: values.taxNumber,
                headerSections: values.headerSections,
                footerSections: values.footerSections,
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
        <Container size="xl">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Grid gutter="lg">
                    {/* Left Column - Form */}
                    <Grid.Col span={{ base: 12, lg: 7 }}>
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
                                        <Box style={{ position: 'relative' }}>
                                            <Select
                                                label={t('form.company')}
                                                placeholder={t('form.companyPlaceholder')}
                                                data={companiesData?.map((c: CompanyData) => ({ value: c.id, label: c.name })) || []}
                                                leftSection={<IconBuilding size={16} />}
                                                rightSection={
                                                    isEdit && form.values.companyId ? (
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            onClick={() => fillFromCompany(form.values.companyId || null)}
                                                            loading={autoFillLoading}
                                                            title={t('form.refillFromCompany')}
                                                        >
                                                            <IconRefresh size={14} />
                                                        </ActionIcon>
                                                    ) : undefined
                                                }
                                                clearable
                                                value={form.values.companyId}
                                                onChange={handleCompanyChange}
                                                error={form.errors.companyId}
                                            />
                                        </Box>

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

                            {/* Header Sections Editor */}
                            {(form.values.type === 'header' || form.values.type === 'full') && (
                                <SectionEditor
                                    sections={form.values.headerSections}
                                    onChange={(sections) => form.setFieldValue('headerSections', sections)}
                                    title={t('sections.headerSections')}
                                    t={t}
                                />
                            )}

                            {/* Footer Sections Editor */}
                            {(form.values.type === 'footer' || form.values.type === 'full') && (
                                <SectionEditor
                                    sections={form.values.footerSections}
                                    onChange={(sections) => form.setFieldValue('footerSections', sections)}
                                    title={t('sections.footerSections')}
                                    t={t}
                                />
                            )}

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
                    </Grid.Col>

                    {/* Right Column - Live Preview & Placeholder Info */}
                    <Grid.Col span={{ base: 12, lg: 5 }}>
                        <Stack gap="md" style={{ position: 'sticky', top: 20 }}>
                            <Paper p="md" withBorder>
                                <Title order={4} mb="md">
                                    {t('preview.title')}
                                </Title>
                                <Text size="sm" c="dimmed" mb="md">
                                    {t('preview.description')}
                                </Text>
                                <TemplatePreview
                                    formValues={form.values}
                                    templateType={form.values.type}
                                    t={t}
                                />
                            </Paper>
                            <PlaceholderInfoTable t={t} />
                        </Stack>
                    </Grid.Col>
                </Grid>
            </form>
        </Container>
    );
}
