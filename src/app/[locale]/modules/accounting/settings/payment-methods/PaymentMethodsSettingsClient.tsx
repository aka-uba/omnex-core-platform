'use client';

import { useState, useCallback } from 'react';
import {
  Container,
  Card,
  Group,
  Text,
  Button,
  Stack,
  Badge,
  ActionIcon,
  TextInput,
  Textarea,
  Select,
  Switch,
  Modal,
  SimpleGrid,
  NumberInput,
  Tooltip,
  Paper,
  Divider,
  ThemeIcon,
} from '@mantine/core';
import {
  IconCreditCard,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCash,
  IconBuildingBank,
  IconReceipt,
  IconRepeat,
  IconDots,
  IconCheck,
  IconGripVertical,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useTranslation } from '@/lib/i18n/client';
import { useCompany } from '@/context/CompanyContext';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  PaymentMethodConfig,
  DEFAULT_PAYMENT_METHOD_CODES,
} from '@/hooks/usePaymentMethods';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { AlertModal } from '@/components/modals/AlertModal';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';

const ICON_MAP: Record<string, React.ReactNode> = {
  IconCash: <IconCash size={20} />,
  IconBuildingBank: <IconBuildingBank size={20} />,
  IconCreditCard: <IconCreditCard size={20} />,
  IconReceipt: <IconReceipt size={20} />,
  IconRepeat: <IconRepeat size={20} />,
  IconDots: <IconDots size={20} />,
};

interface PaymentMethodFormValues {
  name: string;
  code: string;
  description: string;
  icon: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  swiftCode: string;
  branchCode: string;
  accountNumber: string;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

export function PaymentMethodsSettingsClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/accounting');
  const { t: tGlobal } = useTranslation('global');
  const { selectedCompany } = useCompany();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = usePaymentMethods({
    companyId: selectedCompany?.id,
  });

  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();

  const form = useForm<PaymentMethodFormValues>({
    initialValues: {
      name: '',
      code: '',
      description: '',
      icon: 'IconCash',
      bankName: '',
      accountHolder: '',
      iban: '',
      swiftCode: '',
      branchCode: '',
      accountNumber: '',
      isDefault: false,
      sortOrder: 0,
      isActive: true,
    },
  });

  const openCreateModal = useCallback(() => {
    form.reset();
    setEditingId(null);
    setModalOpened(true);
  }, [form]);

  const openEditModal = useCallback((method: PaymentMethodConfig) => {
    form.setValues({
      name: method.name,
      code: method.code,
      description: method.description || '',
      icon: method.icon || 'IconCash',
      bankName: method.bankName || '',
      accountHolder: method.accountHolder || '',
      iban: method.iban || '',
      swiftCode: method.swiftCode || '',
      branchCode: method.branchCode || '',
      accountNumber: method.accountNumber || '',
      isDefault: method.isDefault,
      sortOrder: method.sortOrder,
      isActive: method.isActive,
    });
    setEditingId(method.id);
    setModalOpened(true);
  }, [form]);

  const handleSubmit = useCallback(async (values: PaymentMethodFormValues) => {
    if (!selectedCompany) {
      showToast({
        type: 'error',
        title: tGlobal('common.error'),
        message: 'Şirket seçilmedi',
      });
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: values,
        });
        showToast({
          type: 'success',
          title: tGlobal('common.success'),
          message: 'Ödeme yöntemi güncellendi',
        });
      } else {
        await createMutation.mutateAsync({
          ...values,
          companyId: selectedCompany.id,
        });
        showToast({
          type: 'success',
          title: tGlobal('common.success'),
          message: 'Ödeme yöntemi oluşturuldu',
        });
      }
      setModalOpened(false);
      form.reset();
      setEditingId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('common.error'),
        message: error instanceof Error ? error.message : 'Bir hata oluştu',
      });
    }
  }, [editingId, selectedCompany, createMutation, updateMutation, form, tGlobal]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync(deleteId);
      showToast({
        type: 'success',
        title: tGlobal('common.success'),
        message: 'Ödeme yöntemi silindi',
      });
      setDeleteModalOpened(false);
      setDeleteId(null);
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('common.error'),
        message: error instanceof Error ? error.message : 'Bir hata oluştu',
      });
    }
  }, [deleteId, deleteMutation, tGlobal]);

  const isBankTransfer = form.values.code === 'bank_transfer';

  if (isLoading) {
    return (
      <Container size="xl" pt="xl">
        <DataTableSkeleton columns={4} rows={5} />
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="Ödeme Yöntemleri"
        description="Ödeme yöntemlerini yapılandırın, banka hesaplarını ekleyin"
        namespace="modules/accounting"
        icon={<IconCreditCard size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'Muhasebe', href: `/${locale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'Ödeme Yöntemleri', namespace: 'modules/accounting' },
        ]}
        actions={[
          {
            label: 'Yeni Ödeme Yöntemi',
            icon: <IconPlus size={18} />,
            onClick: openCreateModal,
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="md" mt="xl">
        {data?.paymentMethods && data.paymentMethods.length > 0 ? (
          data.paymentMethods.map((method) => (
            <Card key={method.id} withBorder shadow="sm" padding="lg">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="md">
                  <ThemeIcon
                    size="lg"
                    variant="light"
                    color={method.isActive ? 'blue' : 'gray'}
                  >
                    {ICON_MAP[method.icon || 'IconCash'] || <IconCash size={20} />}
                  </ThemeIcon>
                  <div>
                    <Group gap="xs">
                      <Text fw={600}>{method.name}</Text>
                      {method.isDefault && (
                        <Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>
                          Varsayılan
                        </Badge>
                      )}
                      {!method.isActive && (
                        <Badge color="gray" size="sm">
                          Pasif
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm" c="dimmed">
                      Kod: {method.code}
                      {method.description && ` • ${method.description}`}
                    </Text>
                    {method.code === 'bank_transfer' && method.bankName && (
                      <Text size="xs" c="dimmed" mt={4}>
                        {method.bankName}
                        {method.iban && ` • IBAN: ${method.iban}`}
                      </Text>
                    )}
                  </div>
                </Group>
                <Group gap="xs">
                  <Tooltip label="Düzenle">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => openEditModal(method)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Sil">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        setDeleteId(method.id);
                        setDeleteModalOpened(true);
                      }}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Card>
          ))
        ) : (
          <Paper p="xl" withBorder ta="center">
            <Text c="dimmed">Henüz ödeme yöntemi eklenmemiş.</Text>
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              mt="md"
              onClick={openCreateModal}
            >
              İlk Ödeme Yöntemi Ekle
            </Button>
          </Paper>
        )}
      </Stack>

      {/* Create/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingId(null);
          form.reset();
        }}
        title={editingId ? 'Ödeme Yöntemi Düzenle' : 'Yeni Ödeme Yöntemi'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <SimpleGrid cols={2}>
              <TextInput
                label="Ad"
                placeholder="Örn: Nakit"
                required
                {...form.getInputProps('name')}
              />
              <Select
                label="Kod"
                placeholder="Seçin veya yazın"
                data={DEFAULT_PAYMENT_METHOD_CODES.map((m) => ({
                  value: m.code,
                  label: m.name,
                }))}
                required
                searchable
                {...form.getInputProps('code')}
                onChange={(value) => {
                  form.setFieldValue('code', value || '');
                  // Auto-fill name and icon
                  const preset = DEFAULT_PAYMENT_METHOD_CODES.find((m) => m.code === value);
                  if (preset && !form.values.name) {
                    form.setFieldValue('name', preset.name);
                    form.setFieldValue('icon', preset.icon);
                  }
                }}
              />
            </SimpleGrid>

            <Textarea
              label="Açıklama"
              placeholder="Opsiyonel açıklama"
              {...form.getInputProps('description')}
            />

            <Select
              label="İkon"
              data={[
                { value: 'IconCash', label: 'Nakit' },
                { value: 'IconBuildingBank', label: 'Banka' },
                { value: 'IconCreditCard', label: 'Kart' },
                { value: 'IconReceipt', label: 'Makbuz' },
                { value: 'IconRepeat', label: 'Tekrar' },
                { value: 'IconDots', label: 'Diğer' },
              ]}
              {...form.getInputProps('icon')}
            />

            {isBankTransfer && (
              <>
                <Divider label="Banka Bilgileri" labelPosition="center" />
                <SimpleGrid cols={2}>
                  <TextInput
                    label="Banka Adı"
                    placeholder="Örn: Ziraat Bankası"
                    {...form.getInputProps('bankName')}
                  />
                  <TextInput
                    label="Hesap Sahibi"
                    placeholder="Ad Soyad / Firma Adı"
                    {...form.getInputProps('accountHolder')}
                  />
                </SimpleGrid>
                <TextInput
                  label="IBAN"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  {...form.getInputProps('iban')}
                />
                <SimpleGrid cols={3}>
                  <TextInput
                    label="SWIFT Kodu"
                    placeholder="TCZBTR2A"
                    {...form.getInputProps('swiftCode')}
                  />
                  <TextInput
                    label="Şube Kodu"
                    placeholder="0000"
                    {...form.getInputProps('branchCode')}
                  />
                  <TextInput
                    label="Hesap No"
                    placeholder="0000000000"
                    {...form.getInputProps('accountNumber')}
                  />
                </SimpleGrid>
              </>
            )}

            <Divider label="Ayarlar" labelPosition="center" />

            <SimpleGrid cols={2}>
              <NumberInput
                label="Sıralama"
                placeholder="0"
                min={0}
                {...form.getInputProps('sortOrder')}
              />
              <Stack gap="xs" mt="md">
                <Switch
                  label="Varsayılan Yöntem"
                  {...form.getInputProps('isDefault', { type: 'checkbox' })}
                />
                <Switch
                  label="Aktif"
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Stack>
            </SimpleGrid>

            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={() => {
                  setModalOpened(false);
                  setEditingId(null);
                  form.reset();
                }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? 'Güncelle' : 'Oluştur'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <AlertModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteId(null);
        }}
        title="Ödeme Yöntemi Sil"
        message="Bu ödeme yöntemini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        cancelLabel="İptal"
        onConfirm={handleDelete}
        variant="danger"
      />
    </Container>
  );
}
