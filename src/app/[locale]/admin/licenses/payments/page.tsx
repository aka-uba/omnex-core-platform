'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container,
    Card,
    Table,
    Group,
    Text,
    Badge,
    ActionIcon,
    Button,
    Menu,
    Modal,
    Stack,
    TextInput,
    Tabs,
} from '@mantine/core';
import {
    IconDotsVertical,
    IconSearch,
    IconFilter,
    IconCheck,
    IconX,
    IconEye,
    IconFileInvoice,
    IconClock,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useSearchParams, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format';
import { useTranslation } from '@/lib/i18n/client';
import { LicensePaymentsSkeleton } from './LicensePaymentsSkeleton';

interface LicensePayment {
    id: string;
    licenseId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    invoiceNumber?: string;
    invoiceUrl?: string;
    status: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    paymentDate: string;
    dueDate?: string;
    receiptUrl?: string;
    notes?: string;
    transactionId?: string;
    createdAt: string;
    license?: {
        id: string;
        tenant?: {
            id: string;
            name: string;
            slug: string;
        };
        package?: {
            name: string;
        };
    };
}

export default function LicensePaymentsPage() {
    const { t } = useTranslation('global');
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const licenseIdFilter = searchParams.get('licenseId');

    const [activeTab, setActiveTab] = useState<string | null>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<LicensePayment | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const { data: payments, isLoading } = useQuery<LicensePayment[]>({
        queryKey: ['license-payments', activeTab, licenseIdFilter],
        queryFn: async () => {
            let url = '/api/admin/license-payments?pageSize=100';
            if (activeTab && activeTab !== 'all') url += `&status=${activeTab}`;
            if (licenseIdFilter) url += `&licenseId=${licenseIdFilter}`;
            const response = await fetch(url);
            const data = await response.json();
            return data.success ? data.data : [];
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/admin/license-payments/${id}/approve`, {
                method: 'POST',
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['license-payments'] });
                showToast({
                    type: 'success',
                    title: t('notifications.success.title'),
                    message: t('licenses.notifications.approved'),
                });
            } else {
                showToast({
                    type: 'error',
                    title: t('notifications.error.title'),
                    message: data.error || t('licenses.notifications.approveFailed'),
                });
            }
            setApprovalModalOpen(false);
            setSelectedPayment(null);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            const response = await fetch(`/api/admin/license-payments/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });
            return response.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['license-payments'] });
                showToast({
                    type: 'success',
                    title: t('notifications.success.title'),
                    message: t('licenses.notifications.rejected'),
                });
            } else {
                showToast({
                    type: 'error',
                    title: t('notifications.error.title'),
                    message: data.error || t('licenses.notifications.rejectFailed'),
                });
            }
            setRejectModalOpen(false);
            setSelectedPayment(null);
            setRejectionReason('');
        },
    });

    const filteredPayments = payments?.filter((payment) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            payment.license?.tenant?.name?.toLowerCase().includes(query) ||
            payment.invoiceNumber?.toLowerCase().includes(query) ||
            payment.transactionId?.toLowerCase().includes(query)
        );
    });

    const pendingCount = payments?.filter(p => p.status === 'pending').length || 0;

    const getStatusLabel = (status: string) => t(`licenses.paymentStatus.${status}`) || status;
    const getMethodLabel = (method: string) => t(`licenses.payments.methods.${method}`) || method;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'yellow',
            approved: 'green',
            rejected: 'red',
            refunded: 'gray',
        };
        return colors[status] || 'gray';
    };

    return (
        <Container size="xl" py="md">
            <CentralPageHeader
                title={t('licenses.payments.title')}
                description={t('licenses.payments.description')}
            />

            {isLoading ? (
                <LicensePaymentsSkeleton />
            ) : (
                <>
                    {/* Filters */}
                    <Card withBorder mt="lg" mb="md" p="sm">
                        <Group>
                            <TextInput
                                placeholder={t('licenses.payments.searchPlaceholder')}
                                leftSection={<IconSearch size={16} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                style={{ flex: 1 }}
                            />
                        </Group>
                    </Card>

                    <Card withBorder>
                        <Tabs value={activeTab} onChange={setActiveTab}>
                            <Tabs.List>
                                <Tabs.Tab
                                    value="pending"
                                    leftSection={<IconClock size={16} />}
                                    rightSection={pendingCount > 0 ? (
                                        <Badge size="xs" color="red" variant="filled">
                                            {pendingCount}
                                        </Badge>
                                    ) : null}
                                >
                                    {t('licenses.payments.tabs.pending')}
                                </Tabs.Tab>
                                <Tabs.Tab value="approved" leftSection={<IconCheck size={16} />}>
                                    {t('licenses.payments.tabs.approved')}
                                </Tabs.Tab>
                                <Tabs.Tab value="rejected" leftSection={<IconX size={16} />}>
                                    {t('licenses.payments.tabs.rejected')}
                                </Tabs.Tab>
                                <Tabs.Tab value="all" leftSection={<IconFilter size={16} />}>
                                    {t('licenses.payments.tabs.all')}
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value={activeTab || 'pending'} pt="md">
                                {filteredPayments && filteredPayments.length > 0 ? (
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('licenses.payments.columns.company')}</Table.Th>
                                        <Table.Th>{t('licenses.payments.columns.package')}</Table.Th>
                                        <Table.Th>{t('licenses.payments.columns.amount')}</Table.Th>
                                        <Table.Th>{t('licenses.payments.columns.method')}</Table.Th>
                                        <Table.Th>{t('licenses.payments.columns.invoice')}</Table.Th>
                                        <Table.Th>{t('licenses.payments.columns.date')}</Table.Th>
                                        <Table.Th>{t('licenses.payments.columns.status')}</Table.Th>
                                        <Table.Th w={100}>{t('licenses.payments.columns.actions')}</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredPayments.map((payment) => {
                                        return (
                                            <Table.Tr key={payment.id}>
                                                <Table.Td>
                                                    <Text fw={500}>{payment.license?.tenant?.name || '-'}</Text>
                                                    <Text size="xs" c="dimmed">{payment.license?.tenant?.slug}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">{payment.license?.package?.name || '-'}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text fw={600}>
                                                        {formatCurrency(Number(payment.amount), payment.currency)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="outline">
                                                        {getMethodLabel(payment.paymentMethod)}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    {payment.invoiceNumber ? (
                                                        <Group gap={4}>
                                                            <IconFileInvoice size={14} />
                                                            <Text size="sm">{payment.invoiceNumber}</Text>
                                                        </Group>
                                                    ) : (
                                                        <Text size="sm" c="dimmed">-</Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">
                                                        {new Date(payment.paymentDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                                                    </Text>
                                                    {payment.dueDate && (
                                                        <Text size="xs" c="dimmed">
                                                            {t('licenses.payments.dueDate', {
                                                                date: new Date(payment.dueDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')
                                                            })}
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge color={getStatusColor(payment.status)} variant="light">
                                                        {getStatusLabel(payment.status)}
                                                    </Badge>
                                                    {payment.status === 'rejected' && payment.rejectionReason && (
                                                        <Text size="xs" c="red" mt={2}>
                                                            {payment.rejectionReason}
                                                        </Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    <Menu shadow="md" width={180}>
                                                        <Menu.Target>
                                                            <ActionIcon variant="subtle">
                                                                <IconDotsVertical size={16} />
                                                            </ActionIcon>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            {payment.status === 'pending' && (
                                                                <>
                                                                    <Menu.Item
                                                                        color="green"
                                                                        leftSection={<IconCheck size={14} />}
                                                                        onClick={() => {
                                                                            setSelectedPayment(payment);
                                                                            setApprovalModalOpen(true);
                                                                        }}
                                                                    >
                                                                        {t('licenses.payments.menu.approve')}
                                                                    </Menu.Item>
                                                                    <Menu.Item
                                                                        color="red"
                                                                        leftSection={<IconX size={14} />}
                                                                        onClick={() => {
                                                                            setSelectedPayment(payment);
                                                                            setRejectModalOpen(true);
                                                                        }}
                                                                    >
                                                                        {t('licenses.payments.menu.reject')}
                                                                    </Menu.Item>
                                                                    <Menu.Divider />
                                                                </>
                                                            )}
                                                            {payment.receiptUrl && (
                                                                <Menu.Item
                                                                    leftSection={<IconEye size={14} />}
                                                                    onClick={() => window.open(payment.receiptUrl, '_blank')}
                                                                >
                                                                    {t('licenses.payments.menu.viewReceipt')}
                                                                </Menu.Item>
                                                            )}
                                                            {payment.invoiceUrl && (
                                                                <Menu.Item
                                                                    leftSection={<IconFileInvoice size={14} />}
                                                                    onClick={() => window.open(payment.invoiceUrl, '_blank')}
                                                                >
                                                                    {t('licenses.payments.menu.viewInvoice')}
                                                                </Menu.Item>
                                                            )}
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                                ) : (
                                    <Text ta="center" py="xl" c="dimmed">
                                        {searchQuery
                                            ? t('licenses.payments.noFilterResults')
                                            : t('licenses.payments.noPayments')}
                                    </Text>
                                )}
                            </Tabs.Panel>
                        </Tabs>
                    </Card>
                </>
            )}

            {/* Approval Modal */}
            <Modal
                opened={approvalModalOpen}
                onClose={() => setApprovalModalOpen(false)}
                title={t('licenses.payments.approveTitle')}
                centered
            >
                <Text mb="lg">
                    {t('licenses.payments.approveConfirm', {
                        company: selectedPayment?.license?.tenant?.name || '',
                        amount: selectedPayment ? formatCurrency(Number(selectedPayment.amount), selectedPayment.currency) : ''
                    })}
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setApprovalModalOpen(false)}>
                        {t('buttons.cancel')}
                    </Button>
                    <Button
                        color="green"
                        loading={approveMutation.isPending}
                        onClick={() => selectedPayment && approveMutation.mutate(selectedPayment.id)}
                    >
                        {t('licenses.payments.menu.approve')}
                    </Button>
                </Group>
            </Modal>

            {/* Reject Modal */}
            <Modal
                opened={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                title={t('licenses.payments.rejectTitle')}
                centered
            >
                <Stack>
                    <Text>
                        {t('licenses.payments.rejectConfirm', {
                            company: selectedPayment?.license?.tenant?.name || ''
                        })}
                    </Text>
                    <TextInput
                        label={t('licenses.payments.rejectReason')}
                        placeholder={t('licenses.payments.rejectReasonPlaceholder')}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.currentTarget.value)}
                        required
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setRejectModalOpen(false)}>
                            {t('buttons.cancel')}
                        </Button>
                        <Button
                            color="red"
                            loading={rejectMutation.isPending}
                            disabled={!rejectionReason.trim()}
                            onClick={() =>
                                selectedPayment &&
                                rejectMutation.mutate({
                                    id: selectedPayment.id,
                                    reason: rejectionReason,
                                })
                            }
                        >
                            {t('licenses.payments.menu.reject')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}
