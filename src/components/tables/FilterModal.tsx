'use client';

import { Modal, Stack, TextInput, Select, Button, Group, Text } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { useParams } from 'next/navigation';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange' | 'number';
  options?: { value: any; label: string }[];
}

interface FilterModalProps {
  opened: boolean;
  onClose: () => void;
  filters: FilterOption[];
  activeFilters: Record<string, any>;
  onApply: (filters: Record<string, any>) => void;
  onClear: () => void;
  namespace?: string; // Optional namespace for translations
}

export function FilterModal({
  opened,
  onClose,
  filters,
  activeFilters,
  onApply,
  onClear,
  namespace = 'global',
}: FilterModalProps) {
  const { t } = useTranslation('global'); // Always use global for table.filter keys
  const { t: tNamespace } = useTranslation(namespace); // Use namespace for filter labels if they are i18n keys
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});
  
  // Map locale to dayjs locale
  const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';

  useEffect(() => {
    if (opened) {
      setLocalFilters({ ...activeFilters });
    }
  }, [opened, activeFilters]);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
    onClose();
  };

  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case 'text':
        return (
          <TextInput
            placeholder={t('table.filter.searchPlaceholder', { label: filter.label })}
            value={(localFilters as Record<string, any>)[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.currentTarget.value)}
          />
        );

      case 'select':
        // filter.options içinde boş string değeri var mı kontrol et
        const hasEmptyOption = filter.options?.some(opt => opt.value === '' || opt.value === null || opt.value === undefined);
        const selectOptions = [
          // Eğer boş değer yoksa "Tümü" seçeneğini ekle
          ...(hasEmptyOption ? [] : [{ value: '', label: t('table.filter.all') }]),
          // filter.options'dan boş değerleri filtrele ve string'e çevir
          ...(filter.options || [])
            .filter(opt => opt.value !== '' && opt.value !== null && opt.value !== undefined)
            .map((opt) => {
              // Label'ı kontrol et: Eğer bir i18n key formatındaysa (nokta içeriyorsa, boşluk yok, küçük harf ve nokta ile başlıyorsa) çevir
              let translatedLabel = opt.label;
              
              // İ18n key formatı kontrolü: "types.info", "status.active" gibi
              // Ama "Info", "Warning" gibi çevrilmiş metinleri tekrar çevirmemeli
              const isLikelyI18nKey = opt.label.includes('.') && 
                                      !opt.label.includes(' ') && 
                                      opt.label.length > 3 &&
                                      /^[a-z]+\.[a-z_]+/.test(opt.label); // "types.info" formatı
              
              if (isLikelyI18nKey) {
                const translated = t(opt.label);
                // Eğer çeviri key'den farklıysa ve boş değilse, çeviri başarılı
                if (translated !== opt.label && translated) {
                  translatedLabel = translated;
                }
                // Eğer çeviri başarısız olduysa (key döndüyse), label'ı olduğu gibi kullan
              }
              
              return {
                value: String(opt.value),
                label: translatedLabel,
              };
            }),
        ];
        return (
          <Select
            placeholder={t('table.filter.selectPlaceholder', { label: filter.label })}
            data={selectOptions}
            value={(localFilters as Record<string, any>)[filter.key] ? String((localFilters as Record<string, any>)[filter.key]) : ''}
            onChange={(value) => handleFilterChange(filter.key, value || '')}
            clearable
          />
        );

      case 'date':
        return (
          <DateInput
            placeholder={t('table.filter.selectPlaceholder', { label: filter.label })}
            value={(localFilters as Record<string, any>)[filter.key] ? new Date((localFilters as Record<string, any>)[filter.key]) : null}
            onChange={(date) => handleFilterChange(filter.key, date ? (date as unknown as Date).toISOString() : null)}
            locale={dayjsLocale}
            clearable
          />
        );

      case 'daterange':
        return (
          <Group grow>
            <DateInput
              label={t('table.filter.dateRange.start')}
              placeholder={t('table.filter.dateRange.startPlaceholder')}
              value={localFilters[`${filter.key}_start`] ? new Date(localFilters[`${filter.key}_start`]) : null}
              onChange={(date) => handleFilterChange(`${filter.key}_start`, date ? (date as unknown as Date).toISOString() : null)}
              locale={dayjsLocale}
              clearable
            />
            <DateInput
              label={t('table.filter.dateRange.end')}
              placeholder={t('table.filter.dateRange.endPlaceholder')}
              value={localFilters[`${filter.key}_end`] ? new Date(localFilters[`${filter.key}_end`]) : null}
              onChange={(date) => handleFilterChange(`${filter.key}_end`, date ? (date as unknown as Date).toISOString() : null)}
              locale={dayjsLocale}
              clearable
            />
          </Group>
        );

      case 'number':
        return (
          <TextInput
            type="number"
            placeholder={t('table.filter.numberPlaceholder', { label: filter.label })}
            value={(localFilters as Record<string, any>)[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.currentTarget.value ? Number(e.target.value) : null)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconFilter size={20} />
          <Text fw={600} size="lg">
            {t('table.filter.title')}
          </Text>
        </Group>
      }
      size="md"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        {filters.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            {t('table.filter.noOptions')}
          </Text>
        ) : (
          filters.map((filter) => {
            // Filter label'ı çevir (eğer i18n key ise)
            let filterLabel = filter.label;
            // Eğer label bir i18n key formatındaysa (nokta içeriyorsa), namespace'den çevir
            if (filter.label.includes('.') && !filter.label.includes(' ') && filter.label.length > 3 && /^[a-z]+\.[a-z_]+/.test(filter.label)) {
              const translated = tNamespace(filter.label);
              if (translated !== filter.label && translated) {
                filterLabel = translated;
              }
            }
            
            return (
              <div key={filter.key}>
                <Text size="sm" fw={500} mb="xs">
                  {filterLabel}
                </Text>
                {renderFilterInput(filter)}
              </div>
            );
          })
        )}

        <Group justify="flex-end" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button variant="subtle" onClick={handleClear}>
            {t('table.filter.clear')}
          </Button>
          <Button onClick={handleApply}>{t('table.filter.apply')}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}


