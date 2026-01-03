'use client';

import React, { useEffect } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack, Alert, Paper, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from '@/lib/i18n/client';
import { IconMail, IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';

interface SmtpSettings {
    smtpEnabled: boolean;
    smtpHost?: string | null;
    smtpFromEmail?: string | null;
}

interface TestEmailModalProps {
    opened: boolean;
    onClose: () => void;
    defaultEmail?: string | null;
    smtpSettings: SmtpSettings;
}

interface EmailResult {
    success: boolean;
    message?: string;
    error?: string;
    details?: string;
}

export function TestEmailModal({ opened, onClose, defaultEmail, smtpSettings }: TestEmailModalProps) {
    const { t } = useTranslation('global');
    const [loading, setLoading] = React.useState(false);
    const [result, setResult] = React.useState<EmailResult | null>(null);

    const form = useForm<{
        to: string;
        subject: string;
        message: string;
    }>({
        initialValues: {
            to: defaultEmail || '',
            subject: t('settings.general.email.testEmailModal.defaultSubject'),
            message: t('settings.general.email.testEmailModal.defaultMessage'),
        },
        validate: {
            to: (value) => {
                if (!value) return t('settings.general.email.testEmailModal.toRequired');
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return t('settings.general.email.testEmailModal.invalidEmail');
                }
                return null;
            },
            subject: (value) => (!value ? t('settings.general.email.testEmailModal.subjectRequired') : null),
            message: (value) => (!value ? t('settings.general.email.testEmailModal.messageRequired') : null),
        },
    });

    useEffect(() => {
        if (opened) {
            form.setFieldValue('to', defaultEmail || '');
            form.setFieldValue('subject', t('settings.general.email.testEmailModal.defaultSubject'));
            form.setFieldValue('message', t('settings.general.email.testEmailModal.defaultMessage'));
            setResult(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, defaultEmail]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!smtpSettings.smtpEnabled || !smtpSettings.smtpHost || !smtpSettings.smtpFromEmail) {
            setResult({
                success: false,
                error: t('settings.general.email.testEmailValidationError'),
            });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetchWithAuth('/api/general-settings/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: values.to,
                    subject: values.subject,
                    message: values.message,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    success: true,
                    message: data.message || t('settings.general.email.testEmailSuccess'),
                });
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('settings.general.email.testEmailSuccess'),
                });
                // Auto close after 2 seconds on success
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                // Get translated error message
                const errorKey = data.error || 'TEST_EMAIL_ERROR';
                const translationKey = `settings.general.email.errors.${errorKey}`;
                const translated = t(translationKey);
                // If translation not found (returns the key), use fallback
                const errorMessage = translated !== translationKey
                    ? translated
                    : (data.message || t('settings.general.email.testEmailError'));

                // Get error details
                const errorDetails = data.details ||
                                   (data.error && typeof data.error === 'string' ? data.error : undefined) ||
                                   `${t('settings.general.email.errors.status')}: ${response.status} ${response.statusText}`;

                setResult({
                    success: false,
                    error: errorMessage,
                    details: errorDetails,
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : t('settings.general.email.testEmailError');

            setResult({
                success: false,
                error: errorMessage,
                details: t('settings.general.email.errors.networkError'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        form.reset();
        setResult(null);
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={t('settings.general.email.testEmailModal.title')}
            size="lg"
            centered
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    {!smtpSettings.smtpEnabled && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            title={t('settings.general.email.testEmailModal.smtpDisabled')}
                            color="orange"
                        >
                            {t('settings.general.email.testEmailModal.smtpDisabledMessage')}
                        </Alert>
                    )}

                    {result && (
                        <Alert
                            icon={result.success ? <IconCheck size={16} /> : <IconX size={16} />}
                            title={result.success ? t('success') : t('error')}
                            color={result.success ? 'green' : 'red'}
                        >
                            <Stack gap="xs">
                                <Text
                                    size="sm"
                                    fw={500}
                                    style={{
                                        userSelect: 'text',
                                        cursor: 'text',
                                        wordBreak: 'break-word'
                                    }}
                                    onClick={(e) => {
                                        // Select text on click for easy copying
                                        const range = document.createRange();
                                        range.selectNodeContents(e.currentTarget);
                                        const selection = window.getSelection();
                                        selection?.removeAllRanges();
                                        selection?.addRange(range);
                                    }}
                                >
                                    {result.success ? result.message : result.error}
                                </Text>

                                {!result.success && (
                                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                                        {t('settings.general.email.testEmailModal.checkCredentials')}
                                    </Text>
                                )}

                                {result.details && (
                                    <Paper
                                        p="xs"
                                        bg="gray.0"
                                        style={{
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            userSelect: 'text',
                                            cursor: 'text',
                                            wordBreak: 'break-word',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        onClick={(e) => {
                                            // Select text on click for easy copying
                                            const range = document.createRange();
                                            range.selectNodeContents(e.currentTarget);
                                            const selection = window.getSelection();
                                            selection?.removeAllRanges();
                                            selection?.addRange(range);
                                        }}
                                    >
                                        <Text size="xs" c="dimmed" component="div">
                                            <strong>Detaylar:</strong>
                                            <br />
                                            {result.details}
                                        </Text>
                                    </Paper>
                                )}
                            </Stack>
                        </Alert>
                    )}

                    <TextInput
                        label={t('settings.general.email.testEmailModal.to')}
                        placeholder={t('settings.general.email.testEmailModal.toPlaceholder')}
                        required
                        type="email"
                        disabled={loading}
                        {...form.getInputProps('to')}
                    />

                    <TextInput
                        label={t('settings.general.email.testEmailModal.subject')}
                        placeholder={t('settings.general.email.testEmailModal.subjectPlaceholder')}
                        required
                        disabled={loading}
                        {...form.getInputProps('subject')}
                    />

                    <Textarea
                        label={t('settings.general.email.testEmailModal.message')}
                        placeholder={t('settings.general.email.testEmailModal.messagePlaceholder')}
                        required
                        rows={6}
                        disabled={loading}
                        {...form.getInputProps('message')}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={handleClose} disabled={loading}>
                            {t('form.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            leftSection={<IconMail size={16} />}
                            loading={loading}
                            disabled={!smtpSettings.smtpEnabled}
                        >
                            {t('settings.general.email.testEmailModal.send')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
