'use client';

import { Stack, Title, Text, Group, Badge, Paper, Box } from '@mantine/core';
import { TenantWizardFormData } from '@/lib/schemas/tenant';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

interface ReviewStepProps {
    formData: TenantWizardFormData;
    skipLocation: boolean;
}

export function ReviewStep({ formData, skipLocation }: ReviewStepProps) {
    const { t } = useTranslation('global');
    return (
        <Stack>
            <Title order={4}>{t('companies.wizard.step4.title')}</Title>
            <Text size="sm" c="dimmed">
                {t('companies.wizard.step4.helpText')}
            </Text>

            {/* Basic Info */}
            <Paper p="md" withBorder>
                <Title order={5} mb="sm">{t('companies.wizard.step4.basicInfo')}</Title>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.tenantName')}</Text>
                        <Text size="sm">{formData.basicInfo.name}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.slug')}</Text>
                        <Badge variant="light">{formData.basicInfo.slug}</Badge>
                    </Group>
                    {formData.basicInfo.subdomain && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.subdomain')}</Text>
                            <Text size="sm">{formData.basicInfo.subdomain}.onwindos.com</Text>
                        </Group>
                    )}
                    {formData.basicInfo.customDomain && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.customDomain')}</Text>
                            <Text size="sm">{formData.basicInfo.customDomain}</Text>
                        </Group>
                    )}
                </Stack>
            </Paper>

            {/* Company Info */}
            <Paper p="md" withBorder>
                <Title order={5} mb="sm">{t('companies.wizard.step4.companyInfo')}</Title>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.companyName')}</Text>
                        <Text size="sm">{formData.companyInfo.name}</Text>
                    </Group>

                    {formData.companyInfo.logo && (
                        <Group justify="space-between" align="start">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.logo')}</Text>
                            <Box>
                                <Badge color="green" leftSection={<IconCheck size={12} />}>
                                    {t('companies.wizard.step4.uploaded')}
                                </Badge>
                                <Text size="xs" c="dimmed">
                                    {formData.companyInfo.logo instanceof File ? formData.companyInfo.logo.name : t('companies.wizard.step4.fields.logo')}
                                </Text>
                            </Box>
                        </Group>
                    )}

                    {formData.companyInfo.favicon && (
                        <Group justify="space-between" align="start">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.favicon')}</Text>
                            <Box>
                                <Badge color="green" leftSection={<IconCheck size={12} />}>
                                    {t('companies.wizard.step4.uploaded')}
                                </Badge>
                                <Text size="xs" c="dimmed">
                                    {formData.companyInfo.favicon instanceof File ? formData.companyInfo.favicon.name : t('companies.wizard.step4.fields.favicon')}
                                </Text>
                            </Box>
                        </Group>
                    )}

                    {formData.companyInfo.address && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.address')}</Text>
                            <Text size="sm">{formData.companyInfo.address}</Text>
                        </Group>
                    )}

                    {formData.companyInfo.phone && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.phone')}</Text>
                            <Text size="sm">{formData.companyInfo.phone}</Text>
                        </Group>
                    )}

                    {formData.companyInfo.email && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.email')}</Text>
                            <Text size="sm">{formData.companyInfo.email}</Text>
                        </Group>
                    )}

                    {formData.companyInfo.website && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.website')}</Text>
                            <Text size="sm">{formData.companyInfo.website}</Text>
                        </Group>
                    )}

                    {formData.companyInfo.taxNumber && (
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.taxNumber')}</Text>
                            <Text size="sm">{formData.companyInfo.taxNumber}</Text>
                        </Group>
                    )}
                </Stack>
            </Paper>

            {/* Location Info */}
            <Paper p="md" withBorder>
                <Title order={5} mb="sm">{t('companies.wizard.step4.initialLocation')}</Title>
                {skipLocation ? (
                    <Badge color="gray" leftSection={<IconX size={12} />}>
                        {t('companies.wizard.step4.skipped')}
                    </Badge>
                ) : formData.initialLocation ? (
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.locationName')}</Text>
                            <Text size="sm">{formData.initialLocation.name}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.locationType')}</Text>
                            <Badge variant="light">{formData.initialLocation.type}</Badge>
                        </Group>
                        {formData.initialLocation.address && (
                            <Group justify="space-between">
                                <Text size="sm" fw={500}>{t('companies.wizard.step4.fields.locationAddress')}</Text>
                                <Text size="sm">{formData.initialLocation.address}</Text>
                            </Group>
                        )}
                    </Stack>
                ) : (
                    <Text size="sm" c="dimmed">{t('companies.wizard.step4.noLocation')}</Text>
                )}
            </Paper>
        </Stack>
    );
}
