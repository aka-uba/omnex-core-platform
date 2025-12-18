'use client';

import { TextInput, Stack, Select, Button, Alert } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { TenantWizardFormData } from '@/lib/schemas/tenant';
import { IconInfoCircle, IconPlayerSkipForward } from '@tabler/icons-react';

interface LocationStepProps {
    form: UseFormReturnType<TenantWizardFormData>;
    skipLocation: boolean;
    setSkipLocation: (skip: boolean) => void;
}

export function LocationStep({ form, skipLocation, setSkipLocation }: LocationStepProps) {
    if (skipLocation) {
        return (
            <Stack>
                <Alert icon={<IconInfoCircle size={16} />} title="Location Skipped" color="blue">
                    You can add locations later from the Settings page.
                </Alert>
                <Button variant="light" onClick={() => setSkipLocation(false)}>
                    Add Initial Location
                </Button>
            </Stack>
        );
    }

    return (
        <Stack>
            <Alert icon={<IconInfoCircle size={16} />} title="Optional Step" color="blue">
                You can skip this step and add locations later.
            </Alert>

            <Button
                variant="subtle"
                leftSection={<IconPlayerSkipForward size={16} />}
                onClick={() => setSkipLocation(true)}
            >
                Skip Location Setup
            </Button>

            <TextInput
                label="Location Name"
                placeholder="Main Office"
                required={!skipLocation}
                {...form.getInputProps('initialLocation.name')}
            />

            <Select
                label="Location Type"
                placeholder="Select type"
                required={!skipLocation}
                data={[
                    { value: 'firma', label: 'Firma (Company)' },
                    { value: 'lokasyon', label: 'Lokasyon (Location)' },
                    { value: 'isletme', label: 'İşletme (Business)' },
                    { value: 'koridor', label: 'Koridor (Corridor)' },
                    { value: 'oda', label: 'Oda (Room)' },
                ]}
                {...form.getInputProps('initialLocation.type')}
            />

            <TextInput
                label="Address"
                placeholder="123 Main St, City, Country"
                {...form.getInputProps('initialLocation.address')}
            />

            <TextInput
                label="City"
                placeholder="New York"
                {...form.getInputProps('initialLocation.city')}
            />

            <TextInput
                label="Country"
                placeholder="USA"
                {...form.getInputProps('initialLocation.country')}
            />
        </Stack>
    );
}
