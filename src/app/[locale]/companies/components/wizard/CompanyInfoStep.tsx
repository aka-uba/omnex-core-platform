'use client';

import { TextInput, Stack, FileInput, Text, Group, Image, Box } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { TenantWizardFormData } from '@/lib/schemas/tenant';
import { IconPhoto, IconBrandApple } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface CompanyInfoStepProps {
    form: UseFormReturnType<TenantWizardFormData>;
}

export function CompanyInfoStep({ form }: CompanyInfoStepProps) {
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
                label="Company Name"
                placeholder="ACME Corporation"
                required
                {...form.getInputProps('companyInfo.name')}
            />

            <Group align="start">
                <Box style={{ flex: 1 }}>
                    <FileInput
                        label="Company Logo"
                        placeholder="Upload logo"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        leftSection={<IconPhoto size={16} />}
                        {...form.getInputProps('companyInfo.logo')}
                    />
                    <Text size="xs" c="dimmed" mt={4}>
                        Used in export documents (PDF, Excel, etc.)
                    </Text>
                </Box>
                {logoPreview && (
                    <Box>
                        <Text size="sm" fw={500} mb={4}>Preview:</Text>
                        <Image
                            src={logoPreview}
                            alt="Logo preview"
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
                        label="Favicon"
                        placeholder="Upload favicon"
                        accept="image/x-icon,image/png"
                        leftSection={<IconBrandApple size={16} />}
                        {...form.getInputProps('companyInfo.favicon')}
                    />
                    <Text size="xs" c="dimmed" mt={4}>
                        Icon displayed in browser tab (16x16 or 32x32 px)
                    </Text>
                </Box>
                {faviconPreview && (
                    <Box>
                        <Text size="sm" fw={500} mb={4}>Preview:</Text>
                        <Image
                            src={faviconPreview}
                            alt="Favicon preview"
                            w={32}
                            h={32}
                            fit="contain"
                        />
                    </Box>
                )}
            </Group>

            <TextInput
                label="Address"
                placeholder="123 Main St, City, Country"
                {...form.getInputProps('companyInfo.address')}
            />

            <Group grow>
                <TextInput
                    label="Phone"
                    placeholder="+1 234 567 8900"
                    {...form.getInputProps('companyInfo.phone')}
                />

                <TextInput
                    label="Email"
                    placeholder="info@acme.com"
                    type="email"
                    {...form.getInputProps('companyInfo.email')}
                />
            </Group>

            <Group grow>
                <TextInput
                    label="Website"
                    placeholder="https://acme.com"
                    {...form.getInputProps('companyInfo.website')}
                />

                <TextInput
                    label="Tax Number"
                    placeholder="123-456-789"
                    {...form.getInputProps('companyInfo.taxNumber')}
                />
            </Group>
        </Stack>
    );
}
