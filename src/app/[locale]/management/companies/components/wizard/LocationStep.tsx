'use client';

import { TextInput, Stack, Select, Button, Alert, Group, NumberInput, Textarea } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { TenantWizardFormData } from '@/lib/schemas/tenant';
import { IconInfoCircle, IconPlayerSkipForward } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

interface LocationStepProps {
    form: UseFormReturnType<TenantWizardFormData>;
    skipLocation: boolean;
    setSkipLocation: (skip: boolean) => void;
}

export function LocationStep({ form, skipLocation, setSkipLocation }: LocationStepProps) {
    const { t } = useTranslation('global');
    
    // Auto-generate code from name
    const generateCodeFromName = (name: string): string => {
        if (!name) return '';
        
        const turkishChars: { [key: string]: string } = {
            'ç': 'c', 'Ç': 'C',
            'ğ': 'g', 'Ğ': 'G',
            'ı': 'i', 'İ': 'I',
            'ö': 'o', 'Ö': 'O',
            'ş': 's', 'Ş': 'S',
            'ü': 'u', 'Ü': 'U'
        };
        
        let code = name
            .split('')
            .map(char => turkishChars[char] || char)
            .join('');
        
        code = code
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .toUpperCase()
            .substring(0, 20);
        
        return code;
    };

    if (skipLocation) {
        return (
            <Stack>
                <Alert icon={<IconInfoCircle size={16} />} title={t('companies.wizard.step3.skipTitle')} color="blue">
                    {t('companies.wizard.step3.skipMessage')}
                </Alert>
                <Button variant="light" onClick={() => setSkipLocation(false)}>
                    {t('companies.wizard.step3.addLocation')}
                </Button>
            </Stack>
        );
    }

    return (
        <Stack>
            <Alert icon={<IconInfoCircle size={16} />} title={t('companies.wizard.step3.optionalTitle')} color="blue">
                {t('companies.wizard.step3.optionalMessage')}
            </Alert>

            <Button
                variant="subtle"
                leftSection={<IconPlayerSkipForward size={16} />}
                onClick={() => setSkipLocation(true)}
            >
                {t('companies.wizard.step3.skipButton')}
            </Button>

            <TextInput
                label={t('companies.wizard.step3.fields.locationName')}
                placeholder={t('companies.wizard.step3.fields.locationNamePlaceholder')}
                required={!skipLocation}
                {...form.getInputProps('initialLocation.name')}
                onChange={(e) => {
                    const newName = e.target.value;
                    form.setFieldValue('initialLocation.name', newName);
                    // Auto-generate code if not manually set
                    if (form.values.initialLocation && (!form.values.initialLocation.code || form.values.initialLocation.code === generateCodeFromName(form.values.initialLocation.name || ''))) {
                        form.setFieldValue('initialLocation.code', generateCodeFromName(newName));
                    }
                }}
            />

            <TextInput
                label={t('companies.wizard.step3.fields.code')}
                placeholder={t('companies.wizard.step3.fields.codePlaceholder')}
                {...form.getInputProps('initialLocation.code')}
            />

            <Select
                label={t('companies.wizard.step3.fields.locationType')}
                placeholder={t('companies.wizard.step3.fields.locationTypePlaceholder')}
                required={!skipLocation}
                data={[
                    { value: 'headquarters', label: t('settings.locations.types.headquarters') },
                    { value: 'branch', label: t('settings.locations.types.branch') },
                    { value: 'warehouse', label: t('settings.locations.types.warehouse') },
                    { value: 'office', label: t('settings.locations.types.office') },
                    { value: 'factory', label: t('settings.locations.types.factory') },
                    { value: 'store', label: t('settings.locations.types.store') },
                    { value: 'other', label: t('settings.locations.types.other') },
                ]}
                {...form.getInputProps('initialLocation.type')}
            />

            <TextInput
                label={t('companies.wizard.step3.fields.address')}
                placeholder={t('companies.wizard.step3.fields.addressPlaceholder')}
                {...form.getInputProps('initialLocation.address')}
            />

            <Group grow>
                <TextInput
                    label={t('companies.wizard.step3.fields.city')}
                    placeholder={t('companies.wizard.step3.fields.cityPlaceholder')}
                    {...form.getInputProps('initialLocation.city')}
                />
                <TextInput
                    label={t('companies.wizard.step3.fields.country')}
                    placeholder={t('companies.wizard.step3.fields.countryPlaceholder')}
                    {...form.getInputProps('initialLocation.country')}
                />
            </Group>

            <TextInput
                label={t('companies.wizard.step3.fields.postalCode')}
                placeholder={t('companies.wizard.step3.fields.postalCodePlaceholder')}
                {...form.getInputProps('initialLocation.postalCode')}
            />

            <Group grow>
                <TextInput
                    label={t('companies.wizard.step3.fields.phone')}
                    placeholder={t('companies.wizard.step3.fields.phonePlaceholder')}
                    {...form.getInputProps('initialLocation.phone')}
                />
                <TextInput
                    label={t('companies.wizard.step3.fields.email')}
                    placeholder={t('companies.wizard.step3.fields.emailPlaceholder')}
                    type="email"
                    {...form.getInputProps('initialLocation.email')}
                />
            </Group>

            <Group grow>
                <NumberInput
                    label={t('companies.wizard.step3.fields.latitude')}
                    placeholder={t('companies.wizard.step3.fields.latitudePlaceholder')}
                    decimalScale={8}
                    min={-90}
                    max={90}
                    {...form.getInputProps('initialLocation.latitude')}
                />
                <NumberInput
                    label={t('companies.wizard.step3.fields.longitude')}
                    placeholder={t('companies.wizard.step3.fields.longitudePlaceholder')}
                    decimalScale={8}
                    min={-180}
                    max={180}
                    {...form.getInputProps('initialLocation.longitude')}
                />
            </Group>

            <Textarea
                label={t('companies.wizard.step3.fields.description')}
                placeholder={t('companies.wizard.step3.fields.descriptionPlaceholder')}
                rows={3}
                {...form.getInputProps('initialLocation.description')}
            />
        </Stack>
    );
}
