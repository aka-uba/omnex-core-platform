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
  IconCash,
  IconCreditCard,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCurrency } from '@/hooks/useCurrency';
import styles from './CashFlowDesignV2.module.css';

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

interface CashFlowDesignV2Props {
  transactions: Transaction[];
  summary: Summary | null;
  exportTemplates?: ExportTemplate[];
  selectedTemplateId?: string;
  onTemplateChange?: (templateId: string | undefined) => void;
}

// Circular Progress Component
function CircularProgress({ percentage, type }: { percentage: number; type: 'income' | 'expense' }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={styles.progressContainer}>
      <svg
        className={styles.progressCircle}
        viewBox="0 0 96 96"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          className={styles.progressTrack}
          cx="48"
          cy="48"
          r={radius}
          fill="transparent"
          strokeWidth="8"
          stroke="currentColor"
        />
        <circle
          className={`${styles.progressBar} ${styles[type]}`}
          cx="48"
          cy="48"
          r={radius}
          fill="transparent"
          strokeWidth="8"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className={`${styles.progressLabel} ${styles[type]}`}>{percentage}%</div>
    </div>
  );
}

export function CashFlowDesignV2({
  transactions,
  summary,
  exportTemplates = [],
  selectedTemplateId,
  onTemplateChange,
}: CashFlowDesignV2Props) {
  const { formatCurrency, currency: defaultCurrency } = useCurrency();

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

  // Calculate percentages for circular progress
  const total = (summary?.totalIncome ?? 0) + (summary?.totalExpense ?? 0);
  const incomePercentage = total > 0 ? Math.round(((summary?.totalIncome ?? 0) / total) * 100) : 0;
  const expensePercentage = total > 0 ? Math.round(((summary?.totalExpense ?? 0) / total) * 100) : 0;

  // Format currency with override for transaction currency
  const formatTxCurrency = (amount: number, txCurrency?: string) => {
    return formatCurrency(amount, txCurrency || defaultCurrency);
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
      <div className={styles.designLabel}>V2 - Dynamic Cash Flow Breakdown</div>

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

      {/* Net Cash Flow Card */}
      <div className={styles.netCashFlowCard}>
        <Paper withBorder className={styles.netCashFlowInner} shadow="lg" radius="xl">
          <Text className={styles.netCashFlowLabel} c="dimmed">
            Net Nakit Akışı
          </Text>
          <span
            className={`${styles.netCashFlowValue} ${(summary?.balance ?? 0) < 0 ? styles.negative : styles.positive}`}
          >
            {formatTxCurrency(summary?.balance ?? 0)}
          </span>
          {(summary?.balance ?? 0) < 0 && (
            <span className={styles.trendPill}>
              <IconTrendingDown size={14} />
              Geçen aya göre %2.4
            </span>
          )}
        </Paper>
      </div>

      {/* Two Column Grid */}
      <div className={styles.columnsGrid}>
        {/* Income Section */}
        <div className={styles.sectionColumn}>
          {/* Income Summary Card */}
          <Paper className={`${styles.summaryCard} ${styles.income}`} shadow="xl">
            {/* Sağ tarafta yüzde altında ortalı ikon */}
            <div className={styles.summaryCardIconWrapper}>
              <CircularProgress percentage={incomePercentage} type="income" />
              <IconCash size={56} className={styles.summaryCardIcon} />
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryHeader}>
                <div>
                  <div className={styles.summaryTitleGroup}>
                    <div className={`${styles.summaryIconBox} ${styles.income}`}>
                      <IconTrendingUp size={20} />
                    </div>
                    <Text className={styles.summaryTitle}>Toplam Gelir</Text>
                  </div>
                  <Text className={styles.summaryAmount}>
                    {formatTxCurrency(summary?.totalIncome ?? 0)}
                  </Text>
                  <div className={styles.openBadge}>
                    <span className={`${styles.openBadgeCount} ${styles.income}`}>
                      {pendingIncomeCount} Açık
                    </span>
                    <span className={styles.openBadgeText}>işlem bekliyor</span>
                  </div>
                </div>
              </div>
              <div className={`${styles.cardFooter} ${styles.income}`}>
                <Button
                  variant="subtle"
                  color="green"
                  size="sm"
                  leftSection={<IconDownload size={14} />}
                >
                  Rapor İndir
                </Button>
                <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }}>
                  Analizleri Görüntüle
                </Text>
              </div>
            </div>
          </Paper>

          {/* Search and Actions */}
          <div className={styles.searchActionsRow}>
            <Button variant="subtle" color="blue" size="xs" tt="uppercase">
              Kayıt Tarihi Belirle
            </Button>
            <TextInput
              leftSection={<IconSearch size={14} />}
              placeholder="Gelir ara..."
              size="xs"
              style={{ width: 192 }}
            />
          </div>

          {/* Income Table */}
          <Paper withBorder className={styles.tableCard} shadow="sm">
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr className={styles.income}>
                    <th style={{ width: 40 }}>
                      <Checkbox size="xs" />
                    </th>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th>Tip</th>
                    <th>Pozisyon</th>
                    <th>Numara</th>
                    <th style={{ textAlign: 'right' }}>Tutar</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {incomeTransactions.slice(0, 5).map((tx, index) => (
                    <tr key={tx.id} className={index === 1 ? styles.highlighted : undefined}>
                      <td>
                        <Checkbox size="xs" />
                      </td>
                      <td className={styles.date}>{dayjs(tx.transactionDate).format('DD.MM')}</td>
                      <td>{getStatusBadge(tx.status)}</td>
                      <td className={styles.type}>{tx.category}</td>
                      <td>
                        <div className={styles.positionPrimary}>
                          {tx.description || tx.category}
                        </div>
                        {tx.paymentMethod && (
                          <div className={styles.positionSecondary}>{tx.paymentMethod}</div>
                        )}
                      </td>
                      <td className={styles.type}>{tx.paymentMethod || 'Standart'}</td>
                      <td className={styles.amount}>{formatTxCurrency(tx.amount, tx.currency)}</td>
                      <td className={styles.actions}>
                        <ActionIcon variant="subtle" size="sm" color="gray">
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

        {/* Expense Section */}
        <div className={styles.sectionColumn}>
          {/* Expense Summary Card */}
          <Paper className={`${styles.summaryCard} ${styles.expense}`} shadow="xl">
            {/* Sağ tarafta yüzde altında ortalı ikon */}
            <div className={styles.summaryCardIconWrapper}>
              <CircularProgress percentage={expensePercentage} type="expense" />
              <IconCreditCard size={56} className={styles.summaryCardIcon} />
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryHeader}>
                <div>
                  <div className={styles.summaryTitleGroup}>
                    <div className={`${styles.summaryIconBox} ${styles.expense}`}>
                      <IconTrendingDown size={20} />
                    </div>
                    <Text className={styles.summaryTitle}>Toplam Gider</Text>
                  </div>
                  <Text className={styles.summaryAmount}>
                    {formatTxCurrency(summary?.totalExpense ?? 0)}
                  </Text>
                  <div className={styles.openBadge}>
                    <span className={`${styles.openBadgeCount} ${styles.expense}`}>
                      {pendingExpenseCount} Açık
                    </span>
                    <span className={styles.openBadgeText}>işlem bekliyor</span>
                  </div>
                </div>
              </div>
              <div className={`${styles.cardFooter} ${styles.expense}`}>
                <Button
                  variant="subtle"
                  color="red"
                  size="sm"
                  leftSection={<IconDownload size={14} />}
                >
                  Rapor İndir
                </Button>
                <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }}>
                  Analizleri Görüntüle
                </Text>
              </div>
            </div>
          </Paper>

          {/* Search and Actions */}
          <div className={styles.searchActionsRow}>
            <Button variant="subtle" color="blue" size="xs" tt="uppercase">
              Kayıt Tarihi Belirle
            </Button>
            <TextInput
              leftSection={<IconSearch size={14} />}
              placeholder="Gider ara..."
              size="xs"
              style={{ width: 192 }}
            />
          </div>

          {/* Expense Table */}
          <Paper withBorder className={styles.tableCard} shadow="sm">
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr className={styles.expense}>
                    <th style={{ width: 40 }}>
                      <Checkbox size="xs" />
                    </th>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th>Tip</th>
                    <th>Pozisyon</th>
                    <th>Numara</th>
                    <th style={{ textAlign: 'right' }}>Tutar</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {expenseTransactions.slice(0, 5).map((tx, index) => (
                    <tr key={tx.id} className={index === 0 ? styles.highlighted : undefined}>
                      <td>
                        <Checkbox size="xs" />
                      </td>
                      <td className={styles.date}>{dayjs(tx.transactionDate).format('DD.MM')}</td>
                      <td>{getStatusBadge(tx.status)}</td>
                      <td className={styles.type}>{tx.category}</td>
                      <td>
                        <div className={styles.positionPrimary}>
                          {tx.description || tx.category}
                        </div>
                      </td>
                      <td className={styles.type}>{tx.paymentMethod || 'Standart'}</td>
                      <td className={styles.amount}>{formatTxCurrency(tx.amount, tx.currency)}</td>
                      <td className={styles.actions}>
                        <ActionIcon variant="subtle" size="sm" color="gray">
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

      {/* Deposit Account Summary */}
      <div className={styles.depositSummary}>
        <Text size="lg" fw={500} mb="md">
          Depozito Hesabı Özeti
        </Text>
        <Paper withBorder shadow="sm" style={{ overflow: 'hidden', maxWidth: '32rem' }}>
          <table className={styles.depositTable}>
            <thead>
              <tr>
                <th>Dönem</th>
                <th className={styles.income}>Gelir</th>
                <th className={styles.expense}>Gider</th>
                <th>Tutulan</th>
                <th>Toplam</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Genel</td>
                <td>0,00 €</td>
                <td>0,00 €</td>
                <td>0,00 €</td>
                <td className={styles.total}>0,00 €</td>
              </tr>
              <tr>
                <td>Bu Ay</td>
                <td>0,00 €</td>
                <td>0,00 €</td>
                <td>0,00 €</td>
                <td className={styles.total}>0,00 €</td>
              </tr>
            </tbody>
          </table>
        </Paper>
      </div>
    </div>
  );
}
