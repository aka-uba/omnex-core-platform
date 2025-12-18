'use client';

import React from 'react';
import { Stack, Group, Select, Button, Paper, Title } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

interface RegionTimeTabProps {
    settings: any;
    onSave: (settings: any) => void;
    saving: boolean;
}

export function RegionTimeTab({ settings, onSave, saving }: RegionTimeTabProps) {
    const { t } = useTranslation('global');
    const [formData, setFormData] = React.useState({
        timezone: settings.timezone || 'Europe/Istanbul',
        dateFormat: settings.dateFormat || 'DD/MM/YYYY',
        timeFormat: settings.timeFormat || '24',
        weekStart: settings.weekStart || 'monday',
        currency: settings.currency || 'TRY',
        defaultLanguage: settings.defaultLanguage || 'tr',
    });

    const timezones = [
        { value: 'Europe/Istanbul', label: 'Europe/Istanbul (UTC+3)' },
        { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1)' },
        { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-8)' },
        { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
        { value: 'UTC', label: 'UTC (UTC+0)' },
    ];

    const dateFormats = [
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    ];

    const timeFormats = [
        { value: '12', label: t('settings.general.regionTime.timeFormat12') },
        { value: '24', label: t('settings.general.regionTime.timeFormat24') },
    ];

    const weekStarts = [
        { value: 'monday', label: t('settings.general.regionTime.weekStartMonday') },
        { value: 'sunday', label: t('settings.general.regionTime.weekStartSunday') },
    ];

    const currencies = [
        { value: 'TRY', label: t('settings.general.regionTime.currencyTRY') },
        { value: 'USD', label: t('settings.general.regionTime.currencyUSD') },
        { value: 'EUR', label: t('settings.general.regionTime.currencyEUR') },
        { value: 'GBP', label: t('settings.general.regionTime.currencyGBP') },
        { value: 'JPY', label: t('settings.general.regionTime.currencyJPY') },
        { value: 'CNY', label: t('settings.general.regionTime.currencyCNY') },
    ];

    const languages = [
        { value: 'tr', label: t('settings.general.regionTime.languageTr') },
        { value: 'en', label: t('settings.general.regionTime.languageEn') },
        { value: 'de', label: t('settings.general.regionTime.languageDe') },
        { value: 'ar', label: t('settings.general.regionTime.languageAr') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.general.regionTime.title')}</Title>
                    <Stack gap="md">
                        <Select
                            label={t('settings.general.regionTime.timezone')}
                            data={timezones}
                            value={formData.timezone}
                            onChange={(value) => setFormData({ ...formData, timezone: value || 'Europe/Istanbul' })}
                        />
                        <Group grow>
                            <Select
                                label={t('settings.general.regionTime.dateFormat')}
                                data={dateFormats}
                                value={formData.dateFormat}
                                onChange={(value) => setFormData({ ...formData, dateFormat: value || 'DD/MM/YYYY' })}
                            />
                            <Select
                                label={t('settings.general.regionTime.timeFormat')}
                                data={timeFormats}
                                value={formData.timeFormat}
                                onChange={(value) => setFormData({ ...formData, timeFormat: value || '24' })}
                            />
                        </Group>
                        <Select
                            label={t('settings.general.regionTime.weekStart')}
                            data={weekStarts}
                            value={formData.weekStart}
                            onChange={(value) => setFormData({ ...formData, weekStart: value || 'monday' })}
                        />
                        <Group grow>
                            <Select
                                label={t('settings.general.regionTime.currency')}
                                data={currencies}
                                value={formData.currency}
                                onChange={(value) => setFormData({ ...formData, currency: value || 'TRY' })}
                            />
                            <Select
                                label={t('settings.general.regionTime.defaultLanguage')}
                                data={languages}
                                value={formData.defaultLanguage}
                                onChange={(value) => setFormData({ ...formData, defaultLanguage: value || 'tr' })}
                            />
                        </Group>
                    </Stack>
                </Paper>

                <Group justify="flex-end">
                    <Button
                        type="submit"
                        leftSection={
                            <ClientIcon>
                                <IconDeviceFloppy size={16} />
                            </ClientIcon>
                        }
                        loading={saving}
                    >
                        {t('save')}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

