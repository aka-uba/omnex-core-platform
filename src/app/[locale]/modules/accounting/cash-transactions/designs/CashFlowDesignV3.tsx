'use client';

import { useMemo } from 'react';
import {
  Paper,
  Group,
  Text,
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
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconCategory,
  IconBuildingBank,
  IconPigMoney,
  IconChartLine,
  IconRepeat,
  IconPlus,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import styles from './CashFlowDesignV3.module.css';

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

interface CashFlowDesignV3Props {
  transactions: Transaction[];
  summary: Summary | null;
  exportTemplates?: ExportTemplate[];
  selectedTemplateId?: string;
  onTemplateChange?: (templateId: string | undefined) => void;
}

export function CashFlowDesignV3({
  transactions,
  summary,
  exportTemplates = [],
  selectedTemplateId,
  onTemplateChange,
}: CashFlowDesignV3Props) {
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
    return <span className={styles.statusBadge}>{status}</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.designLabel}>V3 - Two-Column Cash Flow Overview</div>

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

      {/* Top Controls Row */}
      <div className={styles.topControlsRow}>
        {/* Month Selector */}
        <div className={styles.monthSelector}>
          <ActionIcon variant="default" size="lg">
            <IconChevronLeft size={16} />
          </ActionIcon>
          <Paper withBorder className={styles.monthDisplay} shadow="xs">
            <Text size="sm" fw={500}>Ocak 2026</Text>
            <IconCalendar size={14} color="var(--mantine-color-gray-5)" />
          </Paper>
          <ActionIcon variant="default" size="lg">
            <IconChevronRight size={16} />
          </ActionIcon>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Button variant="default" size="xs" leftSection={<IconCategory size={14} />}>
            GIDER TİPİ
          </Button>
          <Button variant="default" size="xs" leftSection={<IconBuildingBank size={14} />}>
            BANKA HESAPLARI
          </Button>
          <Button variant="default" size="xs" leftSection={<IconPigMoney size={14} />}>
            TEMİNAT HESABI
          </Button>
          <Button variant="light" color="indigo" size="xs" leftSection={<IconChartLine size={14} />}>
            KONTROL
          </Button>
          <Button variant="filled" size="xs" leftSection={<IconRepeat size={14} />}>
            DAİMİ EMİRLER
          </Button>
          <Button variant="default" size="xs" leftSection={<IconPlus size={14} />}>
            YENİ ÖDEME
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Search */}
        <div className={styles.searchSection}>
          <TextInput
            leftSection={<IconSearch size={18} />}
            placeholder="Ara..."
            size="sm"
            radius="md"
          />
        </div>

        {/* Balance */}
        <div className={styles.balanceSection}>
          <Paper withBorder className={styles.balanceCard} shadow="xs" radius="lg">
            <Text className={styles.balanceLabel}>Toplam EUR</Text>
            <span
              className={`${styles.balanceValue} ${(summary?.balance ?? 0) < 0 ? styles.negative : styles.positive}`}
            >
              {formatCurrency(summary?.balance ?? 0)}
            </span>
          </Paper>
        </div>

        {/* Deposit Summary */}
        <div className={styles.depositSection}>
          <Paper withBorder className={styles.depositCard} shadow="xs">
            <div className={styles.depositHeader}>
              <span>Teminat Hesabı</span>
            </div>
            <table className={styles.depositTable}>
              <thead>
                <tr>
                  <th>Dönem</th>
                  <th className={styles.income}>Gelir</th>
                  <th className={styles.expense}>Gider</th>
                  <th>Toplam</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Genel</td>
                  <td>0,00 €</td>
                  <td>0,00 €</td>
                  <td>0,00 €</td>
                </tr>
                <tr>
                  <td>Bu Ay</td>
                  <td>0,00 €</td>
                  <td>0,00 €</td>
                  <td>0,00 €</td>
                </tr>
              </tbody>
            </table>
          </Paper>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className={styles.columnsGrid}>
        {/* Income Section */}
        <div className={styles.sectionColumn}>
          <div className={styles.sectionHeader}>
            <h2 className={`${styles.sectionTitle} ${styles.income}`}>
              <IconTrendingUp size={24} />
              Gelirler
            </h2>
            <div className={`${styles.summaryCard} ${styles.income}`}>
              <span className={`${styles.summaryAmount} ${styles.income}`}>
                {formatCurrency(summary?.totalIncome ?? 0)}
              </span>
              <div className={`${styles.openBookingsPill} ${styles.income}`}>
                Açık Kayıtlar: {pendingIncomeCount}
              </div>
            </div>
            <Button
              variant="outline"
              color="gray"
              size="xs"
              className={styles.downloadFilesBtn}
              leftSection={<IconDownload size={12} />}
            >
              GELİR DOSYALARI
            </Button>
          </div>

          <div className={styles.bookingDateAction}>
            <Button variant="subtle" color="blue" size="xs" tt="uppercase">
              KAYIT TARİHİ BELİRLE
            </Button>
          </div>

          <Paper withBorder className={styles.tableCard} shadow="sm">
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr className={styles.income}>
                    <th style={{ width: 40 }}>
                      <Checkbox size="xs" color="green" />
                    </th>
                    <th>Tarih</th>
                    <th>Kayıt Tarihi</th>
                    <th>Tip</th>
                    <th>Pozisyon</th>
                    <th>Numara</th>
                    <th style={{ textAlign: 'right' }}>Tutar EUR</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {incomeTransactions.slice(0, 5).map((tx, index) => (
                    <tr
                      key={tx.id}
                      className={index === 1 ? `${styles.borderLeft}` : ''}
                    >
                      <td>
                        <Checkbox size="xs" color="green" />
                      </td>
                      <td className={styles.date}>{dayjs(tx.transactionDate).format('DD.MM')}</td>
                      <td>{getStatusBadge(tx.status)}</td>
                      <td>{tx.category}</td>
                      <td>
                        <div className={styles.positionPrimary}>{tx.description || tx.category}</div>
                        {tx.paymentMethod && (
                          <div className={styles.positionSecondary}>/{tx.paymentMethod}</div>
                        )}
                      </td>
                      <td>
                        <span className={styles.numberPill}>{tx.paymentMethod || 'Daimi Emir'}</span>
                      </td>
                      <td className={styles.amount}>{formatCurrency(tx.amount, tx.currency)}</td>
                      <td className={styles.actions}>
                        <ActionIcon variant="subtle" size="sm" color="gray">
                          <IconDotsVertical size={14} />
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
          <div className={styles.sectionHeader}>
            <h2 className={`${styles.sectionTitle} ${styles.expense}`}>
              <IconTrendingDown size={24} />
              Giderler
            </h2>
            <div className={`${styles.summaryCard} ${styles.expense}`}>
              <span className={`${styles.summaryAmount} ${styles.expense}`}>
                {formatCurrency(summary?.totalExpense ?? 0)}
              </span>
              <div className={`${styles.openBookingsPill} ${styles.expense}`}>
                Açık Kayıtlar: {pendingExpenseCount}
              </div>
            </div>
            <Button
              variant="outline"
              color="gray"
              size="xs"
              className={styles.downloadFilesBtn}
              leftSection={<IconDownload size={12} />}
            >
              GİDER DOSYALARI
            </Button>
          </div>

          <div className={styles.bookingDateAction}>
            <Button variant="subtle" color="blue" size="xs" tt="uppercase">
              KAYIT TARİHİ BELİRLE
            </Button>
          </div>

          <Paper withBorder className={styles.tableCard} shadow="sm">
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr className={styles.expense}>
                    <th style={{ width: 40 }}>
                      <Checkbox size="xs" color="red" />
                    </th>
                    <th>Tarih</th>
                    <th>Kayıt Tarihi</th>
                    <th>Tip</th>
                    <th>Pozisyon</th>
                    <th>Numara</th>
                    <th style={{ textAlign: 'right' }}>Tutar EUR</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {expenseTransactions.slice(0, 5).map((tx, index) => (
                    <tr
                      key={tx.id}
                      className={index > 0 && index < 4 ? `${styles.borderLeft} ${styles.borderLeftGreen}` : ''}
                    >
                      <td>
                        <Checkbox size="xs" color="red" />
                      </td>
                      <td className={styles.date}>{dayjs(tx.transactionDate).format('DD.MM')}</td>
                      <td>{getStatusBadge(tx.status)}</td>
                      <td className={index > 0 && index < 4 ? styles.typeBordered : ''}>
                        {tx.category}
                      </td>
                      <td>
                        <div className={styles.positionPrimary}>{tx.description || tx.category}</div>
                      </td>
                      <td>
                        <span className={styles.numberPill}>{tx.paymentMethod || 'Daimi Emir'}</span>
                      </td>
                      <td className={styles.amount}>{formatCurrency(tx.amount, tx.currency)}</td>
                      <td className={styles.actions}>
                        <ActionIcon variant="subtle" size="sm" color="gray">
                          <IconDotsVertical size={14} />
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
    </div>
  );
}
