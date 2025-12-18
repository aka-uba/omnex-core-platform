'use client';

import { TextInput, Stack } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { TenantWizardFormData } from '@/lib/schemas/tenant';
import { useEffect } from 'react';

interface BasicInfoStepProps {
    form: UseFormReturnType<TenantWizardFormData>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
    // Auto-generate slug from name
    useEffect(() => {
        if (form.values.basicInfo.name && !form.isTouched('basicInfo.slug')) {
            const slug = form.values.basicInfo.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            form.setFieldValue('basicInfo.slug', slug);

            // Also set subdomain if not touched
            if (!form.isTouched('basicInfo.subdomain')) {
                form.setFieldValue('basicInfo.subdomain', slug);
            }
        }
    }, [form.values.basicInfo.name]);

    return (
        <Stack>
            <TextInput
                label="Tenant Name"
                placeholder="ACME Corporation"
                required
                {...form.getInputProps('basicInfo.name')}
            />

            <TextInput
                label="Slug"
                placeholder="acme"
                description="Used in database naming (lowercase, numbers, hyphens only)"
                required
                {...form.getInputProps('basicInfo.slug')}
            />

            <TextInput
                label="Subdomain"
                placeholder="acme"
                description="Access URL: acme.onwindos.com"
                {...form.getInputProps('basicInfo.subdomain')}
            />

            <TextInput
                label="Custom Domain (Optional)"
                placeholder="https://acme.com"
                {...form.getInputProps('basicInfo.customDomain')}
            />
        </Stack>
    );
}
