'use client';

import { Stack, Title, Text, Group, Badge, Paper, Box } from '@mantine/core';
import { TenantWizardFormData } from '@/lib/schemas/tenant';
import { IconCheck, IconX } from '@tabler/icons-react';

interface ReviewStepProps {
    formData: TenantWizardFormData;
    skipLocation: boolean;
}

export function ReviewStep({ formData, skipLocation }: ReviewStepProps) {
    return (
        <Stack>
            <Title order={4}>Review Your Configuration</Title>
            <Text size="sm" c="dimmed">
                Please review all information before creating the tenant.
            </Text>

            {/* Basic Info */}
            <Paper p="md" withBorder>
                <Title order={5} mb="sm">Basic Information</Title>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Tenant Name:</Text>
                        <Text size="sm">{formData.basicInfo.name}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Slug:</Text>
                        <Badge variant="light">{formData.basicInfo.slug}</Badge>
                    </Group>
                    {formData.basicInfo.subdomain && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Subdomain:</Text>
                            <Text size="sm">{formData.basicInfo.subdomain}.onwindos.com</Text>
                        </Group>
                    )}
                    {formData.basicInfo.customDomain && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Custom Domain:</Text>
                            <Text size="sm">{formData.basicInfo.customDomain}</Text>
                        </Group>
                    )}
                </Stack>
            </Paper>

            {/* Company Info */}
            <Paper p="md" withBorder>
                <Title order={5} mb="sm">Company Information</Title>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Company Name:</Text>
                        <Text size="sm">{formData.companyInfo.name}</Text>
                    </Group>

                    {formData.companyInfo.logo && (
                        <Group justify="space-between" align="start">
                            <Text size="sm" fw={500}>Logo:</Text>
                            <Box>
                                <Badge color="green" leftSection={<IconCheck size={12} />}>
                                    Uploaded
                                </Badge>
                                <Text size="xs" c="dimmed">
                                    {formData.companyInfo.logo instanceof File ? formData.companyInfo.logo.name : 'Logo file'}
                                </Text>
                            </Box>
                        </Group>
                    )}

                    {formData.companyInfo.favicon && (
                        <Group justify="space-between" align="start">
                            <Text size="sm" fw={500}>Favicon:</Text>
                            <Box>
                                <Badge color="green" leftSection={<IconCheck size={12} />}>
                                    Uploaded
                                </Badge>
                                <Text size="xs" c="dimmed">
                                    {formData.companyInfo.favicon instanceof File ? formData.companyInfo.favicon.name : 'Favicon file'}
                                </Text>
                            </Box>
                        </Group>
                    )}

                    {formData.companyInfo.address && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Address:</Text>
                            <Text size="sm">{formData.companyInfo.address}</Text>
                        </Group>
                    )}

                    {formData.companyInfo.phone && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Phone:</Text>
                            <Text size="sm">{formData.companyInfo.phone}</Text>
                        </Group>
                    )}

                    {formData.companyInfo.email && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Email:</Text>
                            <Text size="sm">{formData.companyInfo.email}</Text>
                        </Group>
                    )}

                    {formData.companyInfo.website && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Website:</Text>
                            <Text size="sm">{formData.companyInfo.website}</Text>
                        </Group>
                    )}

                    {formData.companyInfo.taxNumber && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Tax Number:</Text>
                            <Text size="sm">{formData.companyInfo.taxNumber}</Text>
                        </Group>
                    )}
                </Stack>
            </Paper>

            {/* Location Info */}
            <Paper p="md" withBorder>
                <Title order={5} mb="sm">Initial Location</Title>
                {skipLocation ? (
                    <Badge color="gray" leftSection={<IconX size={12} />}>
                        Skipped - Can be added later
                    </Badge>
                ) : formData.initialLocation ? (
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Name:</Text>
                            <Text size="sm">{formData.initialLocation.name}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>Type:</Text>
                            <Badge variant="light">{formData.initialLocation.type}</Badge>
                        </Group>
                        {formData.initialLocation.address && (
                            <Group justify="space-between">
                                <Text size="sm" fw={500}>Address:</Text>
                                <Text size="sm">{formData.initialLocation.address}</Text>
                            </Group>
                        )}
                    </Stack>
                ) : (
                    <Text size="sm" c="dimmed">No location configured</Text>
                )}
            </Paper>
        </Stack>
    );
}
