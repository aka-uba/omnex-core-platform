'use client';

import { useMemo } from 'react';
import {
  Paper,
  Group,
  Text,
  Badge,
  ActionIcon,
  Checkbox,
  Button,
  Select,
  TextInput,
} from '@mantine/core';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconDotsVertical,
  IconSearch,
  IconDownload,
  IconCalendar,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import styles from './CashFlowDesignV1.module.css';

interface Transaction {
  id: string;
  transactionDate: string;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  status?: string;
  paymentMethod: string | null;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface ExportTemplate {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface CashFlowDesignV1Props {
  transactions: Transaction[];
  summary: Summary | null;
  exportTemplates?: ExportTemplate[];
  selectedTemplateId?: string;
  onTemplateChange?: (templateId: string | undefined) => void;
}

export function CashFlowDesignV1({
  transactions,
  summary,
  exportTemplates = [],
  selectedTemplateId,
  onTemplateChange,
}: CashFlowDesignV1Props) {
  // Separate income and expense transactions
  const incomeTransactions = useMemo(
    () => transactions.filter((tx) => tx.type === 'income'),
    [transactions]
  );

  const expenseTransactions = useMemo(
    () => transactions.filter((tx) => tx.type === 'expense'),
    [transactions]
  );

  // Template options for selector
  const templateOptions = useMemo(() => {
    if (!exportTemplates) return [];
    return exportTemplates.map((template) => ({
      value: template.id,
      label: template.isDefault ? `${template.name} (Varsayılan)` : template.name,
    }));
  }, [exportTemplates]);

  // Pending counts
  const pendingIncomeCount = incomeTransactions.filter(
    (tx) => tx.status === 'pending' || tx.status === 'outstanding'
  ).length;
  const pendingExpenseCount = expenseTransactions.filter(
    (tx) => tx.status === 'pending' || tx.status === 'outstanding'
  ).length;

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return `${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${currency === 'EUR' ? '€' : currency}`;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid' || statusLower === 'completed') {
      return <span className={`${styles.statusBadge} ${styles.paid}`}>Ödendi</span>;
    }
    if (statusLower === 'outstanding' || statusLower === 'pending') {
      return <span className={`${styles.statusBadge} ${styles.outstanding}`}>Beklemede</span>;
    }
    return <Badge size="sm">{status}</Badge>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.designLabel}>V1 - Card-Centric Cash Flow Display</div>

      {/* Export Template Selector */}
      {templateOptions.length > 0 && (
        <Paper p="sm" withBorder mb="md">
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">Export Şablonu:</Text>
            <Select
              size="xs"
              placeholder="Şablon seçin..."
              data={templateOptions}
              value={selectedTemplateId || null}
              onChange={(value) => onTemplateChange?.(value || undefined)}
              clearable
              style={{ minWidth: 200 }}
            />
          </Group>
        </Paper>
      )}

      {/* Net Balance Card */}
      <div className={styles.netBalanceCard}>
        <Paper withBorder className={styles.netBalanceInner} shadow="xs" radius="lg">
          <Text className={styles.netBalanceLabel} c="dimmed">
            Net Bakiye (EUR)
          </Text>
          <Group gap="xs" align="center">
            <span
              className={`${styles.netBalanceValue} ${(summary?.balance ?? 0) < 0 ? styles.negative : styles.positive}`}
            >
              {formatCurrency(summary?.balance ?? 0)}
            </span>
            {(summary?.balance ?? 0) < 0 && (
              <span className={`${styles.trendBadge} ${styles.down}`}>
                <IconTrendingDown size={14} />
                12%
              </span>
            )}
          </Group>
        </Paper>
      </div>

      {/* Search and Actions Row */}
      <Group justify="space-between" mb="md">
        <TextInput
          leftSection={<IconSearch size={16} />}
          placeholder="İşlem, mülk veya kiracı ara..."
          style={{ width: 300 }}
          size="sm"
        />
        <Group gap="xs">
          <Button variant="subtle" size="sm" leftSection={<IconDownload size={16} />}>
            Dışa Aktar
          </Button>
        </Group>
      </Group>

      {/* Two Column Grid */}
      <div className={styles.columnsGrid}>
        {/* Income Section */}
        <Paper withBorder className={styles.sectionCard} shadow="xs">
          <div className={styles.incomeHeader}>
            <div className={styles.headerRow}>
              <div className={styles.headerTitle}>
                <div className={`${styles.iconBox} ${styles.income}`}>
                  <IconTrendingUp size={24} />
                </div>
                <Text size="xl" fw={700}>
                  Gelirler
                </Text>
              </div>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={18} />
              </ActionIcon>
            </div>

            <div className={styles.summaryGrid}>
              <div className={`${styles.summaryBox} ${styles.income}`}>
                <Text className={`${styles.summaryLabel} ${styles.income}`}>
                  Toplam Alınan
                </Text>
                <Text className={styles.summaryValue}>
                  {formatCurrency(summary?.totalIncome ?? 0)}
                </Text>
              </div>
              <div className={`${styles.summaryBox} ${styles.neutral}`}>
                <Text className={styles.summaryLabel} c="dimmed">
                  Bekleyen Faturalar
                </Text>
                <div className={styles.pendingInfo}>
                  <Text className={styles.pendingCount} c="dimmed">
                    {pendingIncomeCount}
                  </Text>
                  {pendingIncomeCount > 0 && (
                    <Text className={styles.pendingLabel}>Dikkat Gerekli</Text>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <Group gap="xs">
                <Button variant="default" size="xs" leftSection={<IconCalendar size={14} />}>
                  Tarih Belirle
                </Button>
                <Button variant="default" size="xs">
                  Dosya İçe Aktar
                </Button>
              </Group>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <Checkbox size="xs" />
                  </th>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th>Pozisyon</th>
                  <th style={{ textAlign: 'right' }}>Tutar</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {incomeTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <Checkbox size="xs" />
                    </td>
                    <td className={styles.date}>{dayjs(tx.transactionDate).format('DD.MM')}</td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td>
                      <div className={styles.positionPrimary}>{tx.description || tx.category}</div>
                      <div className={styles.positionSecondary}>{tx.paymentMethod || '-'}</div>
                    </td>
                    <td className={styles.amount}>{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className={styles.actions}>
                      <ActionIcon variant="subtle" size="sm" className={styles.actionBtn}>
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Paper>

        {/* Expense Section */}
        <Paper withBorder className={styles.sectionCard} shadow="xs">
          <div className={styles.expenseHeader}>
            <div className={styles.headerRow}>
              <div className={styles.headerTitle}>
                <div className={`${styles.iconBox} ${styles.expense}`}>
                  <IconTrendingDown size={24} />
                </div>
                <Text size="xl" fw={700}>
                  Giderler
                </Text>
              </div>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={18} />
              </ActionIcon>
            </div>

            <div className={styles.summaryGrid}>
              <div className={`${styles.summaryBox} ${styles.expense}`}>
                <Text className={`${styles.summaryLabel} ${styles.expense}`}>
                  Toplam Ödenen
                </Text>
                <Text className={styles.summaryValue}>
                  {formatCurrency(summary?.totalExpense ?? 0)}
                </Text>
              </div>
              <div className={`${styles.summaryBox} ${styles.neutral}`}>
                <Text className={styles.summaryLabel} c="dimmed">
                  Bekleyen Faturalar
                </Text>
                <div className={styles.pendingInfo}>
                  <Text className={styles.pendingCount} c="dimmed">
                    {pendingExpenseCount}
                  </Text>
                  {pendingExpenseCount > 0 && (
                    <Text className={styles.pendingLabel}>Ödenmeli</Text>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <Group gap="xs">
                <Button variant="default" size="xs" leftSection={<IconCalendar size={14} />}>
                  Tarih Belirle
                </Button>
                <Button variant="default" size="xs">
                  Dosya İçe Aktar
                </Button>
              </Group>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <Checkbox size="xs" />
                  </th>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th>Pozisyon</th>
                  <th style={{ textAlign: 'right' }}>Tutar</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {expenseTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <Checkbox size="xs" />
                    </td>
                    <td className={styles.date}>{dayjs(tx.transactionDate).format('DD.MM')}</td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td>
                      <div className={styles.positionPrimary}>{tx.description || tx.category}</div>
                      <div className={styles.positionSecondary}>{tx.paymentMethod || '-'}</div>
                    </td>
                    <td className={styles.amount}>{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className={styles.actions}>
                      <ActionIcon variant="subtle" size="sm" className={styles.actionBtn}>
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Paper>
      </div>
    </div>
  );
}
