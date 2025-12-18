'use client';

import { useRouter } from 'next/navigation';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { IconTools, IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { useRealEstateMaintenanceRecord } from '@/hooks/useRealEstateMaintenanceRecords';
import { useTranslation } from '@/lib/i18n/client';

interface MaintenanceRecordDetailHeaderProps {
  locale: string;
  recordId: string;
}

export function MaintenanceRecordDetailHeader({ locale, recordId }: MaintenanceRecordDetailHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { data: record, isLoading } = useRealEstateMaintenanceRecord(recordId);

  // Build title with apartment details
  let title = t('maintenance.detail.title');
  if (record && !isLoading) {
    const apartment = (record as any).apartment;
    if (apartment) {
      const unitNumber = apartment.unitNumber || '';
      title = `${unitNumber} No'lu Daire - ${t('maintenance.title')}`;
    }
  }

  return (
    <CentralPageHeader
      title={title}
      description={t('maintenance.detail.description')}
      namespace="modules/real-estate"
      icon={<IconTools size={32} />}
      breadcrumbs={[
        { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
        { label: 'menu.label', href: `/${locale}/modules/real-estate/dashboard`, namespace: 'modules/real-estate' },
        { label: 'maintenance.title', href: `/${locale}/modules/real-estate/maintenance`, namespace: 'modules/real-estate' },
        { label: 'maintenance.detail.title', namespace: 'modules/real-estate' },
      ]}
      actions={[
        {
          label: t('actions.back'),
          icon: <IconArrowLeft size={16} />,
          onClick: () => router.back(),
          variant: 'subtle',
        },
        {
          label: t('actions.edit'),
          icon: <IconEdit size={16} />,
          onClick: () => router.push(`/${locale}/modules/real-estate/maintenance/${recordId}/edit`),
        },
      ]}
    />
  );
}












