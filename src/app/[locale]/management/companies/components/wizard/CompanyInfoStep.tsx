'use client';

import { TextInput, Stack, FileInput, Text, Group, Image, Box, Textarea, SimpleGrid, NumberInput, Divider } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { TenantWizardFormData } from '@/lib/schemas/tenant';
import { IconPhoto, IconBrandApple, IconInfoCircle, IconUsers, IconCalendar, IconMapPin, IconFileText, IconCreditCard } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface CompanyInfoStepProps {
    form: UseFormReturnType<TenantWizardFormData>;
}

export function CompanyInfoStep({ form }: CompanyInfoStepProps) {
    const { t } = useTranslation('global');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

    // Auto-fill company name from tenant name
    useEffect(() => {
        if (form.values.basicInfo.name && !form.isTouched('companyInfo.name')) {
            form.setFieldValue('companyInfo.name', form.values.basicInfo.name);
        }
    }, [form.values.basicInfo.name]);

    // Logo preview
    useEffect(() => {
        if (form.values.companyInfo.logo instanceof File) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(form.values.companyInfo.logo);
        } else {
            setLogoPreview(null);
        }
    }, [form.values.companyInfo.logo]);

    // Favicon preview
    useEffect(() => {
        if (form.values.companyInfo.favicon instanceof File) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFaviconPreview(reader.result as string);
            };
            reader.readAsDataURL(form.values.companyInfo.favicon);
        } else {
            setFaviconPreview(null);
        }
    }, [form.values.companyInfo.favicon]);

    return (
        <Stack>
            <TextInput
                label={t('companies.wizard.step2.fields.companyName')}
                placeholder={t('companies.wizard.step2.fields.companyNamePlaceholder')}
                required
                {...form.getInputProps('companyInfo.name')}
            />

            <Group align="start">
                <Box style={{ flex: 1 }}>
                    <FileInput
                        label={t('companies.wizard.step2.fields.logo')}
                        placeholder={t('companies.wizard.step2.fields.logoPlaceholder')}
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        leftSection={<IconPhoto size={16} />}
                        {...form.getInputProps('companyInfo.logo')}
                    />
                    <Text size="xs" c="dimmed" mt={4}>
                        {t('companies.wizard.step2.fields.logoDescription')}
                    </Text>
                </Box>
                {logoPreview && (
                    <Box>
                        <Text size="sm" fw={500} mb={4}>{t('companies.wizard.step2.fields.logoPreview')}</Text>
                        <Image
                            src={logoPreview}
                            alt={t('companies.wizard.step2.fields.logoPreview')}
                            w={100}
                            h={100}
                            fit="contain"
                        />
                    </Box>
                )}
            </Group>

            <Group align="start">
                <Box style={{ flex: 1 }}>
                    <FileInput
                        label={t('companies.wizard.step2.fields.favicon')}
                        placeholder={t('companies.wizard.step2.fields.faviconPlaceholder')}
                        accept="image/x-icon,image/png"
                        leftSection={<IconBrandApple size={16} />}
                        {...form.getInputProps('companyInfo.favicon')}
                    />
                    <Text size="xs" c="dimmed" mt={4}>
                        {t('companies.wizard.step2.fields.faviconDescription')}
                    </Text>
                </Box>
                {faviconPreview && (
                    <Box>
                        <Text size="sm" fw={500} mb={4}>{t('companies.wizard.step2.fields.logoPreview')}</Text>
                        <Image
                            src={faviconPreview}
                            alt={t('companies.wizard.step2.fields.logoPreview')}
                            w={32}
                            h={32}
                            fit="contain"
                        />
                    </Box>
                )}
            </Group>

            <TextInput
                label={t('companies.wizard.step2.fields.address')}
                placeholder={t('companies.wizard.step2.fields.addressPlaceholder')}
                {...form.getInputProps('companyInfo.address')}
            />

            <Group grow>
                <TextInput
                    label={t('companies.wizard.step2.fields.phone')}
                    placeholder={t('companies.wizard.step2.fields.phonePlaceholder')}
                    {...form.getInputProps('companyInfo.phone')}
                />

                <TextInput
                    label={t('companies.wizard.step2.fields.email')}
                    placeholder={t('companies.wizard.step2.fields.emailPlaceholder')}
                    type="email"
                    {...form.getInputProps('companyInfo.email')}
                />
            </Group>

            <TextInput
                label={t('companies.wizard.step2.fields.website')}
                placeholder={t('companies.wizard.step2.fields.websitePlaceholder')}
                {...form.getInputProps('companyInfo.website')}
            />

            <TextInput
                label={t('companies.form.industry')}
                placeholder={t('companies.form.industryPlaceholder')}
                leftSection={<IconInfoCircle size={16} />}
                {...form.getInputProps('companyInfo.industry')}
            />

            <Textarea
                label={t('companies.form.description')}
                placeholder={t('companies.form.descriptionPlaceholder')}
                rows={3}
                {...form.getInputProps('companyInfo.description')}
            />

            <SimpleGrid cols={3}>
                <NumberInput
                    label={t('companies.form.foundedYear')}
                    placeholder={t('companies.form.foundedYearPlaceholder')}
                    leftSection={<IconCalendar size={16} />}
                    {...form.getInputProps('companyInfo.foundedYear')}
                />

                <NumberInput
                    label={t('companies.form.employeeCount')}
                    placeholder={t('companies.form.employeeCountPlaceholder')}
                    leftSection={<IconUsers size={16} />}
                    {...form.getInputProps('companyInfo.employeeCount')}
                />

                <TextInput
                    label={t('companies.form.capital')}
                    placeholder={t('companies.form.capitalPlaceholder')}
                    {...form.getInputProps('companyInfo.capital')}
                />
            </SimpleGrid>

            <Divider label={t('companies.tabs.contact')} labelPosition="left" />

            <SimpleGrid cols={2}>
                <TextInput
                    label={t('companies.form.city')}
                    placeholder={t('companies.form.cityPlaceholder')}
                    leftSection={<IconMapPin size={16} />}
                    {...form.getInputProps('companyInfo.city')}
                />

                <TextInput
                    label={t('companies.form.state')}
                    placeholder={t('companies.form.statePlaceholder')}
                    {...form.getInputProps('companyInfo.state')}
                />
            </SimpleGrid>

            <SimpleGrid cols={2}>
                <TextInput
                    label={t('companies.form.postalCode')}
                    placeholder={t('companies.form.postalCodePlaceholder')}
                    {...form.getInputProps('companyInfo.postalCode')}
                />

                <TextInput
                    label={t('companies.form.country')}
                    placeholder={t('companies.form.countryPlaceholder')}
                    {...form.getInputProps('companyInfo.country')}
                />
            </SimpleGrid>

            <Divider label={t('companies.tabs.legal')} labelPosition="left" />

            <Group grow>
                <TextInput
                    label={t('companies.wizard.step2.fields.taxNumber')}
                    placeholder={t('companies.wizard.step2.fields.taxNumberPlaceholder')}
                    {...form.getInputProps('companyInfo.taxNumber')}
                />

                <TextInput
                    label={t('companies.form.taxOffice')}
                    placeholder={t('companies.form.taxOfficePlaceholder')}
                    {...form.getInputProps('companyInfo.taxOffice')}
                />
            </Group>

            <SimpleGrid cols={2}>
                <TextInput
                    label={t('companies.form.registrationNumber')}
                    placeholder={t('companies.form.registrationNumberPlaceholder')}
                    leftSection={<IconFileText size={16} />}
                    {...form.getInputProps('companyInfo.registrationNumber')}
                />

                <TextInput
                    label={t('companies.form.mersisNumber')}
                    placeholder={t('companies.form.mersisNumberPlaceholder')}
                    {...form.getInputProps('companyInfo.mersisNumber')}
                />
            </SimpleGrid>

            <Divider label={t('companies.tabs.financial')} labelPosition="left" />

            <TextInput
                label={t('companies.form.iban')}
                placeholder={t('companies.form.ibanPlaceholder')}
                leftSection={<IconCreditCard size={16} />}
                {...form.getInputProps('companyInfo.iban')}
            />

            <SimpleGrid cols={2}>
                <TextInput
                    label={t('companies.form.bankName')}
                    placeholder={t('companies.form.bankNamePlaceholder')}
                    {...form.getInputProps('companyInfo.bankName')}
                />

                <TextInput
                    label={t('companies.form.accountHolder')}
                    placeholder={t('companies.form.accountHolderPlaceholder')}
                    {...form.getInputProps('companyInfo.accountHolder')}
                />
            </SimpleGrid>
        </Stack>
    );
}
