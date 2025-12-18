'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container,
    Card,
    TextInput,
    Textarea,
    NumberInput,
    Switch,
    Button,
    Group,
    Stack,
    Select,
    MultiSelect,
    ColorInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useParams, useRouter } from 'next/navigation';

const FEATURE_OPTIONS = [
    { value: 'api_access', label: 'API Erişimi' },
    { value: 'priority_support', label: 'Öncelikli Destek' },
    { value: 'custom_domain', label: 'Özel Alan Adı' },
    { value: 'white_label', label: 'Beyaz Etiket' },
    { value: 'advanced_analytics', label: 'Gelişmiş Analitik' },
    { value: 'bulk_import', label: 'Toplu İçe Aktarma' },
    { value: 'export_all', label: 'Tam Dışa Aktarma' },
    { value: 'audit_logs', label: 'Denetim Logları' },
    { value: 'sso', label: 'Tek Oturum Açma (SSO)' },
    { value: 'custom_integrations', label: 'Özel Entegrasyonlar' },
];

const ICON_OPTIONS = [
    { value: 'ShieldCheck', label: 'Kalkan (Onay)' },
    { value: 'Shield', label: 'Kalkan' },
    { value: 'Star', label: 'Yıldız' },
    { value: 'Crown', label: 'Taç' },
    { value: 'Diamond', label: 'Elmas' },
    { value: 'Rocket', label: 'Roket' },
    { value: 'Award', label: 'Ödül' },
    { value: 'Certificate', label: 'Sertifika' },
];

export default function CreateLicenseTypePage() {
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string || 'tr';
    const queryClient = useQueryClient();

    const form = useForm({
        initialValues: {
            name: '',
            displayName: '',
            description: '',
            color: '#228be6',
            icon: 'ShieldCheck',
            maxUsers: undefined as number | undefined,
            maxStorage: undefined as number | undefined,
            maxCompanies: undefined as number | undefined,
            features: [] as string[],
            defaultDurationDays: 365,
            trialDays: 0,
            sortOrder: 0,
            isActive: true,
            isDefault: false,
        },
        validate: {
            name: (value) => (!value ? 'Tür adı zorunludur' : null),
            displayName: (value) => (!value ? 'Görünen ad zorunludur' : null),
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const response = await fetch('/api/admin/license-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['license-types'] });
                showToast({
                    type: 'success',
                    title: 'Başarılı',
                    message: 'Lisans türü oluşturuldu',
                });
                router.push(`/${locale}/admin/licenses/types`);
            } else {
                showToast({
                    type: 'error',
                    title: 'Hata',
                    message: data.error || 'Oluşturma işlemi başarısız',
                });
            }
        },
        onError: () => {
            showToast({
                type: 'error',
                title: 'Hata',
                message: 'Oluşturma işlemi sırasında bir hata oluştu',
            });
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        // Convert name to slug format
        const formattedValues = {
            ...values,
            name: values.name.toLowerCase().replace(/\s+/g, '_'),
        };
        createMutation.mutate(formattedValues);
    };

    return (
        <Container size="md" py="md">
            <CentralPageHeader
                title="Yeni Lisans Türü"
                description="Yeni bir lisans türü oluşturun"
                breadcrumbs={[
                    { label: 'Lisans Yönetimi', href: `/${locale}/admin/licenses` },
                    { label: 'Lisans Türleri', href: `/${locale}/admin/licenses/types` },
                    { label: 'Yeni Tür' },
                ]}
            />

            <Card withBorder mt="lg" p="lg">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        <Group grow>
                            <TextInput
                                label="Tür Adı (Slug)"
                                placeholder="standard"
                                description="Sistem içi benzersiz tanımlayıcı"
                                required
                                {...form.getInputProps('name')}
                            />
                            <TextInput
                                label="Görünen Ad"
                                placeholder="Standart"
                                description="Kullanıcılara gösterilecek ad"
                                required
                                {...form.getInputProps('displayName')}
                            />
                        </Group>

                        <Textarea
                            label="Açıklama"
                            placeholder="Bu lisans türü için kısa açıklama..."
                            minRows={2}
                            {...form.getInputProps('description')}
                        />

                        <Group grow>
                            <ColorInput
                                label="Badge Rengi"
                                placeholder="#228be6"
                                {...form.getInputProps('color')}
                            />
                            <Select
                                label="İkon"
                                data={ICON_OPTIONS}
                                {...form.getInputProps('icon')}
                            />
                        </Group>

                        <Group grow>
                            <NumberInput
                                label="Maksimum Kullanıcı"
                                placeholder="Sınırsız için boş bırakın"
                                min={1}
                                {...form.getInputProps('maxUsers')}
                            />
                            <NumberInput
                                label="Maksimum Depolama (GB)"
                                placeholder="Sınırsız için boş bırakın"
                                min={1}
                                {...form.getInputProps('maxStorage')}
                            />
                            <NumberInput
                                label="Maksimum Firma"
                                placeholder="Sınırsız için boş bırakın"
                                min={1}
                                {...form.getInputProps('maxCompanies')}
                            />
                        </Group>

                        <MultiSelect
                            label="Özellikler"
                            placeholder="Özellikleri seçin"
                            data={FEATURE_OPTIONS}
                            searchable
                            clearable
                            {...form.getInputProps('features')}
                        />

                        <Group grow>
                            <NumberInput
                                label="Varsayılan Süre (Gün)"
                                description="Yıllık için 365, aylık için 30"
                                min={1}
                                required
                                {...form.getInputProps('defaultDurationDays')}
                            />
                            <NumberInput
                                label="Deneme Süresi (Gün)"
                                description="0 = deneme yok"
                                min={0}
                                {...form.getInputProps('trialDays')}
                            />
                            <NumberInput
                                label="Sıralama"
                                description="Küçükten büyüğe sıralanır"
                                min={0}
                                {...form.getInputProps('sortOrder')}
                            />
                        </Group>

                        <Group>
                            <Switch
                                label="Aktif"
                                description="Devre dışı türler paket oluşturmada görünmez"
                                {...form.getInputProps('isActive', { type: 'checkbox' })}
                            />
                            <Switch
                                label="Varsayılan"
                                description="Yeni tenant'lar için varsayılan tür"
                                {...form.getInputProps('isDefault', { type: 'checkbox' })}
                            />
                        </Group>

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => router.push(`/${locale}/admin/licenses/types`)}
                            >
                                İptal
                            </Button>
                            <Button type="submit" loading={createMutation.isPending}>
                                Oluştur
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </Container>
    );
}
