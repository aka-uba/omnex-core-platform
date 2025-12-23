'use client';

import { useState, useEffect, useCallback } from 'react';
import { Stepper, Button, Group, Paper, Container } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { tenantWizardSchema, type TenantWizardFormData } from '@/lib/schemas/tenant';
import { BasicInfoStep } from './wizard/BasicInfoStep';
import { CompanyInfoStep } from './wizard/CompanyInfoStep';
import { ReviewStep } from './wizard/ReviewStep';
import { CreationProgressStep } from './wizard/CreationProgressStep';
import { CredentialsSummaryStep } from './wizard/CredentialsSummaryStep';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useRouter, usePathname } from 'next/navigation';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useTranslation } from '@/lib/i18n/client';

const STORAGE_KEY = 'tenant-creation-wizard-draft';

interface TenantCreationWizardProps {
    locale: string;
}

// Helper to get saved form data from localStorage
function getSavedFormData(): Partial<TenantWizardFormData> | null {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error reading saved form data:', e);
    }
    return null;
}

// Helper to save form data to localStorage
function saveFormData(data: TenantWizardFormData) {
    if (typeof window === 'undefined') return;
    try {
        // Don't save file inputs (logo, favicon, pwaIcon) as they can't be serialized
        const dataToSave = {
            basicInfo: data.basicInfo,
            companyInfo: {
                ...data.companyInfo,
                logo: undefined,
                favicon: undefined,
                pwaIcon: undefined,
            },
            initialLocation: data.initialLocation,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.error('Error saving form data:', e);
    }
}

// Helper to clear saved form data
function clearSavedFormData() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Error clearing saved form data:', e);
    }
}

export function TenantCreationWizard({ locale }: TenantCreationWizardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation('global');
    const [active, setActive] = useState(0);
    const [isCreating, setIsCreating] = useState(false);
    const [creationResult, setCreationResult] = useState<any>(null);
    // Location step removed - always skip
    const skipLocation = true;

    // Determine if this is from settings or management route
    const isFromSettings = pathname?.includes('/settings/add-company');

    // Get default values, merging with any saved data
    const getInitialValues = useCallback((): TenantWizardFormData => {
        const defaultValues: TenantWizardFormData = {
            basicInfo: {
                name: '',
                slug: '',
                subdomain: '',
                customDomain: '',
            },
            companyInfo: {
                name: '',
                address: '',
                city: '',
                state: '',
                postalCode: '',
                country: '',
                phone: '',
                email: '',
                website: '',
                industry: '',
                description: '',
                foundedYear: undefined,
                employeeCount: undefined,
                capital: '',
                taxNumber: '',
                taxOffice: '',
                registrationNumber: '',
                mersisNumber: '',
                iban: '',
                bankName: '',
                accountHolder: '',
            },
            initialLocation: undefined,
        };

        const saved = getSavedFormData();
        if (saved) {
            return {
                basicInfo: { ...defaultValues.basicInfo, ...saved.basicInfo },
                companyInfo: { ...defaultValues.companyInfo, ...saved.companyInfo },
                initialLocation: saved.initialLocation || defaultValues.initialLocation,
            };
        }
        return defaultValues;
    }, []);

    const form = useForm<TenantWizardFormData>({
        validate: zodResolver(tenantWizardSchema),
        initialValues: getInitialValues(),
    });

    // Load saved data on mount
    useEffect(() => {
        const saved = getSavedFormData();
        if (saved) {
            if (saved.basicInfo) {
                Object.entries(saved.basicInfo).forEach(([key, value]) => {
                    if (value) form.setFieldValue(`basicInfo.${key}`, value);
                });
            }
            if (saved.companyInfo) {
                Object.entries(saved.companyInfo).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        form.setFieldValue(`companyInfo.${key}`, value);
                    }
                });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-save form data when it changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveFormData(form.values);
        }, 500); // Debounce 500ms
        return () => clearTimeout(timeoutId);
    }, [form.values]);

    const nextStep = () => {
        // Allow navigation between steps, but validate current step
        // Users can navigate freely, validation happens on submit
        // Steps: 0=BasicInfo, 1=CompanyInfo, 2=Review, 3=Creating, 4=Completed
        setActive((current) => (current < 3 ? current + 1 : current));
    };

    const prevStep = () => {
        setActive((current) => (current > 0 ? current - 1 : current));
    };

    const handleSubmit = async () => {
        // Validate all required fields before submitting
        // Collect missing required fields and set errors on form
        const missingFields: string[] = [];
        let hasErrors = false;
        let firstErrorStep = -1;
        
        // Check Basic Info step
        if (!form.values.basicInfo.name || !form.values.basicInfo.name.trim()) {
            const fieldLabel = t('companies.wizard.step1.fields.tenantName');
            missingFields.push(fieldLabel);
            form.setFieldError('basicInfo.name', t('companies.wizard.step1.fields.tenantNameRequired') || `${fieldLabel} gereklidir`);
            hasErrors = true;
            if (firstErrorStep === -1) firstErrorStep = 0;
        } else {
            form.clearFieldError('basicInfo.name');
        }
        
        if (!form.values.basicInfo.slug || !form.values.basicInfo.slug.trim()) {
            const fieldLabel = t('companies.wizard.step1.fields.slug');
            missingFields.push(fieldLabel);
            form.setFieldError('basicInfo.slug', t('companies.wizard.step1.fields.slugRequired') || `${fieldLabel} gereklidir`);
            hasErrors = true;
            if (firstErrorStep === -1) firstErrorStep = 0;
        } else {
            form.clearFieldError('basicInfo.slug');
        }
        
        // Check Company Info step
        if (!form.values.companyInfo.name || !form.values.companyInfo.name.trim()) {
            const fieldLabel = t('companies.wizard.step2.fields.companyName');
            missingFields.push(fieldLabel);
            form.setFieldError('companyInfo.name', t('companies.wizard.step2.fields.companyNameRequired') || `${fieldLabel} gereklidir`);
            hasErrors = true;
            if (firstErrorStep === -1) firstErrorStep = 1;
        } else {
            form.clearFieldError('companyInfo.name');
        }
        
        // Show error if there are missing fields
        if (hasErrors) {
            const errorMessage = t('companies.wizard.requiredFields') + ' ' + missingFields.join(', ');
            
            showToast({
                type: 'error',
                title: t('companies.wizard.validationError'),
                message: errorMessage,
            });
            
            // Navigate to the first step with missing fields
            if (firstErrorStep !== -1) {
                setActive(firstErrorStep);
            }
            
            return;
        }

        setIsCreating(true);
        setActive(3); // Creating step

        try {
            const formData = new FormData();
            formData.append('name', form.values.basicInfo.name);
            formData.append('slug', form.values.basicInfo.slug);
            if (form.values.basicInfo.subdomain) {
                formData.append('subdomain', form.values.basicInfo.subdomain);
            }

            formData.append('companyName', form.values.companyInfo.name);
            if (form.values.companyInfo.logo) {
                formData.append('logo', form.values.companyInfo.logo);
            }
            if (form.values.companyInfo.favicon) {
                formData.append('favicon', form.values.companyInfo.favicon);
            }
            if (form.values.companyInfo.pwaIcon) {
                formData.append('pwaIcon', form.values.companyInfo.pwaIcon);
            }
            if (form.values.companyInfo.address) {
                formData.append('address', form.values.companyInfo.address);
            }
            if (form.values.companyInfo.phone) {
                formData.append('phone', form.values.companyInfo.phone);
            }
            if (form.values.companyInfo.email) {
                formData.append('email', form.values.companyInfo.email);
            }
            if (form.values.companyInfo.website) {
                formData.append('website', form.values.companyInfo.website);
            }
            if (form.values.companyInfo.industry) {
                formData.append('companyIndustry', form.values.companyInfo.industry);
            }
            if (form.values.companyInfo.description) {
                formData.append('companyDescription', form.values.companyInfo.description);
            }
            if (form.values.companyInfo.foundedYear) {
                formData.append('companyFoundedYear', form.values.companyInfo.foundedYear.toString());
            }
            if (form.values.companyInfo.employeeCount) {
                formData.append('companyEmployeeCount', form.values.companyInfo.employeeCount.toString());
            }
            if (form.values.companyInfo.capital) {
                formData.append('companyCapital', form.values.companyInfo.capital);
            }
            if (form.values.companyInfo.city) {
                formData.append('companyCity', form.values.companyInfo.city);
            }
            if (form.values.companyInfo.state) {
                formData.append('companyState', form.values.companyInfo.state);
            }
            if (form.values.companyInfo.postalCode) {
                formData.append('companyPostalCode', form.values.companyInfo.postalCode);
            }
            if (form.values.companyInfo.country) {
                formData.append('companyCountry', form.values.companyInfo.country);
            }
            if (form.values.companyInfo.taxNumber) {
                formData.append('taxNumber', form.values.companyInfo.taxNumber);
            }
            if (form.values.companyInfo.taxOffice) {
                formData.append('companyTaxOffice', form.values.companyInfo.taxOffice);
            }
            if (form.values.companyInfo.registrationNumber) {
                formData.append('companyRegistrationNumber', form.values.companyInfo.registrationNumber);
            }
            if (form.values.companyInfo.mersisNumber) {
                formData.append('companyMersisNumber', form.values.companyInfo.mersisNumber);
            }
            if (form.values.companyInfo.iban) {
                formData.append('companyIban', form.values.companyInfo.iban);
            }
            if (form.values.companyInfo.bankName) {
                formData.append('companyBankName', form.values.companyInfo.bankName);
            }
            if (form.values.companyInfo.accountHolder) {
                formData.append('companyAccountHolder', form.values.companyInfo.accountHolder);
            }

            // Location step removed - no location data sent

            const response = await fetch('/api/tenants', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create tenant');
            }

            setCreationResult(result.data);
            setActive(4); // Completed step

            // Clear saved form data after successful creation
            clearSavedFormData();

            showToast({
                type: 'success',
                title: t('companies.wizard.success.title'),
                message: t('companies.wizard.success.message'),
            });
        } catch (error: any) {
            showToast({
                type: 'error',
                title: t('companies.wizard.error.title'),
                message: error.message || t('companies.wizard.error.message'),
            });
            setActive(2); // Back to Review step on error
        } finally {
            setIsCreating(false);
        }
    };

    // Breadcrumbs based on route
    const breadcrumbs = isFromSettings
        ? [
              { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
              { label: 'navigation.settings', href: `/${locale}/settings`, namespace: 'global' },
              { label: 'companies.title', href: `/${locale}/settings/company`, namespace: 'global' },
              { label: 'companies.createTitle', namespace: 'global' },
          ]
        : [
              { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
              { label: 'navigation.superadmin', href: `/${locale}/management`, namespace: 'global' },
              { label: 'management.companies.title', href: `/${locale}/management/companies`, namespace: 'global' },
              { label: 'companies.createTitle', namespace: 'global' },
          ];

    return (
        <Container size="xl" pt="xl">
            <CentralPageHeader
                title="companies.createTitle"
                description="companies.createDescription"
                namespace="global"
                icon={<IconBuilding size={32} />}
                breadcrumbs={breadcrumbs}
            />
            <Paper p="xl" radius="md" withBorder mt="xl">

            <Stepper
                active={active}
                onStepClick={(step) => {
                    // Allow clicking on any step except the "Creating" step (step 3)
                    // Users can navigate freely between steps
                    if (step < 3) {
                        setActive(step);
                    }
                }}
            >
                <Stepper.Step
                    label={t('companies.wizard.step1.label')}
                    description={t('companies.wizard.step1.description')}
                >
                    <BasicInfoStep form={form} />
                </Stepper.Step>

                <Stepper.Step
                    label={t('companies.wizard.step2.label')}
                    description={t('companies.wizard.step2.description')}
                >
                    <CompanyInfoStep form={form} />
                </Stepper.Step>

                <Stepper.Step
                    label={t('companies.wizard.step4.label')}
                    description={t('companies.wizard.step4.description')}
                >
                    <ReviewStep
                        formData={form.values}
                        skipLocation={skipLocation}
                    />
                </Stepper.Step>

                <Stepper.Step
                    label={t('companies.wizard.step5.label')}
                    description={t('companies.wizard.step5.description')}
                    allowStepClick={false}
                >
                    <CreationProgressStep />
                </Stepper.Step>

                <Stepper.Completed>
                    <CredentialsSummaryStep
                        result={creationResult}
                        onFinish={() => router.push(`/${locale}/companies`)}
                    />
                </Stepper.Completed>
            </Stepper>

            <Group justify="space-between" mt="xl">
                {active > 0 && active < 3 && (
                    <Button variant="default" onClick={prevStep}>
                        {t('companies.wizard.buttons.back')}
                    </Button>
                )}

                {active < 2 && (
                    <Button onClick={nextStep} ml="auto">
                        {t('companies.wizard.buttons.next')}
                    </Button>
                )}

                {active === 2 && (
                    <Button onClick={handleSubmit} loading={isCreating} ml="auto">
                        {t('companies.wizard.buttons.createTenant')}
                    </Button>
                )}
            </Group>
            </Paper>
        </Container>
    );
}
