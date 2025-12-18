'use client';

import { TextInput, Stack, Loader } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { TenantWizardFormData } from '@/lib/schemas/tenant';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { IconCheck, IconX } from '@tabler/icons-react';

interface BasicInfoStepProps {
    form: UseFormReturnType<TenantWizardFormData>;
}

type CheckStatus = 'idle' | 'checking' | 'available' | 'taken';

export function BasicInfoStep({ form }: BasicInfoStepProps) {
    const { t } = useTranslation('global');
    const [slugStatus, setSlugStatus] = useState<CheckStatus>('idle');
    const [subdomainStatus, setSubdomainStatus] = useState<CheckStatus>('idle');
    const slugTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const subdomainTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check slug availability
    const checkSlugAvailability = useCallback(async (slug: string) => {
        if (!slug || slug.length < 2) {
            setSlugStatus('idle');
            return;
        }

        setSlugStatus('checking');
        try {
            const response = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
            const data = await response.json();

            if (data.success) {
                setSlugStatus(data.available ? 'available' : 'taken');
                if (!data.available) {
                    form.setFieldError('basicInfo.slug', t('companies.wizard.step1.fields.slugTaken') || 'Bu kod zaten kullanılıyor');
                } else {
                    form.clearFieldError('basicInfo.slug');
                }
            }
        } catch (error) {
            console.error('Error checking slug:', error);
            setSlugStatus('idle');
        }
    }, [form, t]);

    // Check subdomain availability
    const checkSubdomainAvailability = useCallback(async (subdomain: string) => {
        if (!subdomain || subdomain.length < 2) {
            setSubdomainStatus('idle');
            return;
        }

        setSubdomainStatus('checking');
        try {
            const response = await fetch(`/api/check-slug?subdomain=${encodeURIComponent(subdomain)}`);
            const data = await response.json();

            if (data.success) {
                setSubdomainStatus(data.subdomainAvailable ? 'available' : 'taken');
                if (!data.subdomainAvailable) {
                    form.setFieldError('basicInfo.subdomain', t('companies.wizard.step1.fields.subdomainTaken') || 'Bu alt alan adı zaten kullanılıyor');
                } else {
                    form.clearFieldError('basicInfo.subdomain');
                }
            }
        } catch (error) {
            console.error('Error checking subdomain:', error);
            setSubdomainStatus('idle');
        }
    }, [form, t]);

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

    // Debounced slug check
    useEffect(() => {
        if (slugTimeoutRef.current) {
            clearTimeout(slugTimeoutRef.current);
        }

        const slug = form.values.basicInfo.slug;
        if (slug && slug.length >= 2) {
            slugTimeoutRef.current = setTimeout(() => {
                checkSlugAvailability(slug);
            }, 500);
        } else {
            setSlugStatus('idle');
        }

        return () => {
            if (slugTimeoutRef.current) {
                clearTimeout(slugTimeoutRef.current);
            }
        };
    }, [form.values.basicInfo.slug, checkSlugAvailability]);

    // Debounced subdomain check
    useEffect(() => {
        if (subdomainTimeoutRef.current) {
            clearTimeout(subdomainTimeoutRef.current);
        }

        const subdomain = form.values.basicInfo.subdomain;
        if (subdomain && subdomain.length >= 2) {
            subdomainTimeoutRef.current = setTimeout(() => {
                checkSubdomainAvailability(subdomain);
            }, 500);
        } else {
            setSubdomainStatus('idle');
        }

        return () => {
            if (subdomainTimeoutRef.current) {
                clearTimeout(subdomainTimeoutRef.current);
            }
        };
    }, [form.values.basicInfo.subdomain, checkSubdomainAvailability]);

    // Get input right section based on status
    const getRightSection = (status: CheckStatus) => {
        switch (status) {
            case 'checking':
                return <Loader size="xs" />;
            case 'available':
                return <IconCheck size={16} color="green" />;
            case 'taken':
                return <IconX size={16} color="red" />;
            default:
                return null;
        }
    };

    return (
        <Stack>
            <TextInput
                label={t('companies.wizard.step1.fields.tenantName')}
                placeholder={t('companies.wizard.step1.fields.tenantNamePlaceholder')}
                required
                {...form.getInputProps('basicInfo.name')}
            />

            <TextInput
                label={t('companies.wizard.step1.fields.slug')}
                placeholder={t('companies.wizard.step1.fields.slugPlaceholder')}
                description={t('companies.wizard.step1.fields.slugDescription')}
                required
                rightSection={getRightSection(slugStatus)}
                error={slugStatus === 'taken' ? (t('companies.wizard.step1.fields.slugTaken') || 'Bu kod zaten kullanılıyor') : form.errors['basicInfo.slug']}
                {...form.getInputProps('basicInfo.slug')}
            />

            <TextInput
                label={t('companies.wizard.step1.fields.subdomain')}
                placeholder={t('companies.wizard.step1.fields.subdomainPlaceholder')}
                description={t('companies.wizard.step1.fields.subdomainDescription')}
                rightSection={getRightSection(subdomainStatus)}
                error={subdomainStatus === 'taken' ? (t('companies.wizard.step1.fields.subdomainTaken') || 'Bu alt alan adı zaten kullanılıyor') : form.errors['basicInfo.subdomain']}
                {...form.getInputProps('basicInfo.subdomain')}
            />

            <TextInput
                label={t('companies.wizard.step1.fields.customDomain')}
                placeholder={t('companies.wizard.step1.fields.customDomainPlaceholder')}
                {...form.getInputProps('basicInfo.customDomain')}
            />
        </Stack>
    );
}
