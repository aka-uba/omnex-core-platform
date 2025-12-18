'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    TextInput,
    Textarea,
    Select,
    Switch,
    Button,
    Group,
    Paper,
    Grid,
    Title,
    FileInput,
    LoadingOverlay
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconUpload, IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { notificationSchema, NotificationFormValues } from '@/modules/notifications/schemas/notification.schema';
import { useRouter, useParams } from 'next/navigation';

interface NotificationFormProps {
    initialValues?: Partial<NotificationFormValues>;
    onSubmit: (values: NotificationFormValues) => void;
    isLoading?: boolean;
    isEdit?: boolean;
}

// Helper hook for users list (modül bağımsızlığı için optional)
function useUsersList() {
    const [users, setUsers] = useState<Array<{ value: string; label: string }>>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load users (modül bağımsızlığı için optional)
        const loadUsers = async () => {
            try {
                setLoading(true);
                // Fetch users directly from API
                const response = await fetch('/api/users?pageSize=100');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.users && Array.isArray(data.data.users)) {
                        setUsers(
                            data.data.users.map((user: { id: string; name: string; email: string }) => ({
                                value: user.id,
                                label: `${user.name} (${user.email})`,
                            }))
                        );
                    }
                }
            } catch (error) {
                // Silently fail - modül bağımsızlığı
                // Users list will remain empty
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, []);

    return { users, loading };
}

export function NotificationForm({ initialValues, onSubmit, isLoading, isEdit }: NotificationFormProps) {
    const { t } = useTranslation('modules/notifications');
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    const router = useRouter();
    const { users: usersList, loading: usersLoading } = useUsersList();

    const form = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationSchema) as any,
        defaultValues: {
            title: '',
            message: '',
            type: 'info',
            priority: 'medium',
            status: initialValues?.status || 'unread',
            is_global: initialValues?.is_global || false,
            data: initialValues?.data || '{}',
            ...initialValues,
        },
    });

    const isGlobal = form.watch('is_global');
    const type = form.watch('type');

    // Reset recipient_id if global is checked
    useEffect(() => {
        if (isGlobal) {
            form.setValue('recipient_id', undefined);
        }
    }, [isGlobal, form]);

    // Type options with translations
    const typeOptions = [
        { value: 'info', label: t('type.info') },
        { value: 'warning', label: t('type.warning') },
        { value: 'error', label: t('type.error') },
        { value: 'success', label: t('type.success') },
        { value: 'task', label: t('type.task') },
        { value: 'alert', label: t('type.alert') },
    ];

    // Priority options with translations
    const priorityOptions = [
        { value: 'low', label: t('priority.low') },
        { value: 'medium', label: t('priority.medium') },
        { value: 'high', label: t('priority.high') },
        { value: 'urgent', label: t('priority.urgent') },
    ];

    return (
        <Paper p="xl" radius="md" withBorder pos="relative">
            <LoadingOverlay {...(isLoading !== undefined ? { visible: isLoading } : {})} />
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Grid>
                    <Grid.Col span={12}>
                        <Title order={3} mb="md">{isEdit ? t('edit') : t('create')}</Title>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <TextInput
                            label={t('fields.title')}
                            placeholder={t('fields.title')}
                            required
                            {...form.register('title')}
                            error={form.formState.errors.title?.message}
                            mb="md"
                        />

                        <Textarea
                            label={t('fields.message')}
                            placeholder={t('fields.message')}
                            required
                            minRows={4}
                            {...form.register('message')}
                            error={form.formState.errors.message?.message}
                            mb="md"
                        />

                        <Grid>
                            <Grid.Col span={6}>
                                <Controller
                                    name="type"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select
                                            label={t('fields.type')}
                                            data={typeOptions}
                                            {...field}
                                            error={form.formState.errors.type?.message}
                                        />
                                    )}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Controller
                                    name="priority"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select
                                            label={t('fields.priority')}
                                            data={priorityOptions}
                                            {...field}
                                            error={form.formState.errors.priority?.message}
                                        />
                                    )}
                                />
                            </Grid.Col>
                        </Grid>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper p="md" bg="var(--mantine-color-gray-0)" withBorder>
                            <Controller
                                name="is_global"
                                control={form.control}
                                render={({ field }) => (
                                    <Switch
                                        label={t('fields.is_global')}
                                        checked={field.value}
                                        onChange={(event) => field.onChange(event.currentTarget.checked)}
                                        mb="md"
                                    />
                                )}
                            />

                            <Controller
                                name="sender_id"
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        label={t('fields.sender')}
                                        placeholder={usersLoading ? t('placeholders.loading_users') : t('placeholders.select_sender')}
                                        data={usersList}
                                        disabled={usersLoading}
                                        {...(field.value ? { value: field.value } : {})}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                        {...(form.formState.errors.sender_id?.message ? { error: form.formState.errors.sender_id.message } : {})}
                                        mb="md"
                                    />
                                )}
                            />

                            <Controller
                                name="recipient_id"
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        label={t('fields.recipient')}
                                        placeholder={usersLoading ? t('placeholders.loading_users') : t('placeholders.select_recipient')}
                                        data={usersList}
                                        disabled={isGlobal || usersLoading}
                                        {...(field.value ? { value: field.value } : {})}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                        {...(form.formState.errors.recipient_id?.message ? { error: form.formState.errors.recipient_id.message } : {})}
                                        mb="md"
                                    />
                                )}
                            />

                            <Controller
                                name="expires_at"
                                control={form.control}
                                render={({ field }) => (
                                    <DateInput
                                        label={t('fields.expires_at')}
                                        placeholder={t('placeholders.pick_date')}
                                        {...(field.value ? { value: field.value } : {})}
                                        onChange={field.onChange}
                                        clearable
                                        mb="md"
                                     locale={dayjsLocale} />
                                )}
                            />

                            <Controller
                                name="location_id"
                                control={form.control}
                                render={({ field }) => (
                                    <Select
                                        label={t('fields.location')}
                                        placeholder={t('placeholders.select_location')}
                                        data={['loc-1', 'loc-2']} // Mock data
                                        {...(field.value ? { value: field.value } : {})}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                        {...(form.formState.errors.location_id?.message ? { error: form.formState.errors.location_id.message } : {})}
                                        mb="md"
                                    />
                                )}
                            />
                        </Paper>
                    </Grid.Col>

                    {type === 'task' && (
                        <Grid.Col span={12}>
                            <Paper p="md" withBorder mt="md">
                                <Title order={5} mb="md">{t('task_details.title')}</Title>
                                <Grid>
                                    <Grid.Col span={6}>
                                        <TextInput
                                            label={t('fields.action_url')}
                                            {...form.register('action_url')}
                                            error={form.formState.errors.action_url?.message}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <TextInput
                                            label={t('fields.action_text')}
                                            {...form.register('action_text')}
                                            error={form.formState.errors.action_text?.message}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Paper>
                        </Grid.Col>
                    )}

                    <Grid.Col span={12}>
                        <FileInput
                            label={t('fields.attachments')}
                            placeholder={t('placeholders.upload_files')}
                            multiple
                            leftSection={<IconUpload size={14} />}
                            mt="md"
                        />
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <Group justify="flex-end" mt="xl">
                            <Button variant="default" onClick={() => router.back()}>
                                {t('actions.cancel')}
                            </Button>
                            <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={isLoading ?? false}>
                                {t('actions.save')}
                            </Button>
                        </Group>
                    </Grid.Col>
                </Grid>
            </form>
        </Paper>
    );
}
