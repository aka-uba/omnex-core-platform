'use client';

import { useState } from 'react';
import { Stepper, Button, Group, Paper, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { tenantWizardSchema, type TenantWizardFormData } from '@/lib/schemas/tenant';
import { BasicInfoStep } from './wizard/BasicInfoStep';
import { CompanyInfoStep } from './wizard/CompanyInfoStep';
import { ReviewStep } from './wizard/ReviewStep';
import { CreationProgressStep } from './wizard/CreationProgressStep';
import { CredentialsSummaryStep } from './wizard/CredentialsSummaryStep';
import { useNotification } from '@/hooks/useNotification';
import { useRouter } from 'next/navigation';

interface TenantCreationWizardProps {
    locale: string;
}

export function TenantCreationWizard({ locale }: TenantCreationWizardProps) {
    const router = useRouter();
    const { showSuccess, showError } = useNotification();
    const [active, setActive] = useState(0);
    const [isCreating, setIsCreating] = useState(false);
    const [creationResult, setCreationResult] = useState<any>(null);
    // Location step removed - always skip
    const skipLocation = true;

    const form = useForm<TenantWizardFormData>({
        validate: zodResolver(tenantWizardSchema),
        initialValues: {
            basicInfo: {
                name: '',
                slug: '',
                subdomain: '',
                customDomain: '',
            },
            companyInfo: {
                name: '',
                address: '',
                phone: '',
                email: '',
                website: '',
                taxNumber: '',
            },
            initialLocation: undefined,
        },
    });

    const nextStep = () => {
        // Steps: 0=BasicInfo, 1=CompanyInfo, 2=Review, 3=Creating, 4=Completed
        setActive((current) => (current < 3 ? current + 1 : current));
    };

    const prevStep = () => {
        setActive((current) => (current > 0 ? current - 1 : current));
    };

    const handleSubmit = async () => {
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
            if (form.values.companyInfo.taxNumber) {
                formData.append('taxNumber', form.values.companyInfo.taxNumber);
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

            showSuccess('Tenant created successfully!');
        } catch (error: any) {
            showError(error.message || 'Failed to create tenant');
            setActive(2); // Back to Review step on error
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Paper p="xl" radius="md" withBorder>
            <Title order={2} mb="xl">
                Create New Tenant
            </Title>

            <Stepper
                active={active}
                onStepClick={(step) => {
                    // Allow clicking on any step except the "Creating" step (step 3)
                    if (step < 3) {
                        setActive(step);
                    }
                }}
            >
                <Stepper.Step label="Basic Info" description="Tenant details">
                    <BasicInfoStep form={form} />
                </Stepper.Step>

                <Stepper.Step label="Company Info" description="Logo & details">
                    <CompanyInfoStep form={form} />
                </Stepper.Step>

                <Stepper.Step label="Review" description="Confirm details">
                    <ReviewStep
                        formData={form.values}
                        skipLocation={skipLocation}
                    />
                </Stepper.Step>

                <Stepper.Step label="Creating" description="Please wait" allowStepClick={false}>
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
                        Back
                    </Button>
                )}

                {active < 2 && (
                    <Button onClick={nextStep} ml="auto">
                        Next
                    </Button>
                )}

                {active === 2 && (
                    <Button onClick={handleSubmit} loading={isCreating} ml="auto">
                        Create Tenant
                    </Button>
                )}
            </Group>
        </Paper>
    );
}
