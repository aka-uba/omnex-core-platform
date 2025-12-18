'use client';

// import { useState } from 'react'; // removed - unused
import { Paper } from '@mantine/core';
import { useParams } from 'next/navigation';
import { DateInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import type { ReportType } from '../types/report';

interface ReportFiltersProps {
  selectedType?: string;
  onTypeChange?: (type: string) => void;
  dateRange?: { from: Date | null; to: Date | null };
  onDateRangeChange?: (range: { from: Date | null; to: Date | null }) => void;
  reportTypes?: ReportType[];
}

export function ReportFilters({
  selectedType,
  onTypeChange,
  dateRange,
  onDateRangeChange,
  reportTypes = [],
}: ReportFiltersProps) {
  const { t } = useTranslation('modules/raporlar');
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
  // const [showFilters] = useState(false); // removed - unused

  return (
    <Paper shadow="sm" p="md" radius="md" className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">{t('filters.title')}</h2>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('filters.description')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Report Type Selector */}
        {reportTypes.length > 0 && (
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              {t('filters.type')}
            </label>
            <select
              className="w-full h-10 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark px-4 focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedType || ''}
              onChange={(e) => onTypeChange?.(e.target.value)}
            >
              <option value="">{t('filters.allReports')}</option>
              <optgroup label={t('filters.coreReports')}>
                {reportTypes.filter(type => type.category === 'core').map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </optgroup>
              {reportTypes.filter(type => type.category === 'module').length > 0 && (
                <optgroup label={t('filters.moduleReports')}>
                  {reportTypes.filter(type => type.category === 'module').map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        {/* Date Range */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            {t('filters.dateRange')}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateInput
              placeholder={t('filters.startDate')}
              value={dateRange?.from || null}
              onChange={(value) => {
                onDateRangeChange?.({
                  from: value as Date | null,
                  to: dateRange?.to || null,
                });
              }}
              locale={dayjsLocale}
              leftSection={<IconCalendar size={20} />}
              className="w-full"
              clearable
            />
            <DateInput
              placeholder={t('filters.endDate')}
              value={dateRange?.to || null}
              onChange={(value) => {
                onDateRangeChange?.({
                  from: dateRange?.from || null,
                  to: value as Date | null,
                });
              }}
              locale={dayjsLocale}
              leftSection={<IconCalendar size={20} />}
              className="w-full"
              clearable
            />
          </div>
        </div>
      </div>
    </Paper>
  );
}

