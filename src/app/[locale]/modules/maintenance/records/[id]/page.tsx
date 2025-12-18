import { MaintenanceRecordDetail } from '@/modules/maintenance/components/MaintenanceRecordDetail';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { getServerTranslation } from '@/lib/i18n/server';
import { IconTools } from '@tabler/icons-react';

interface MaintenanceRecordDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function MaintenanceRecordDetailPage({ params }: MaintenanceRecordDetailPageProps) {
  const { locale, id } = await params;
  const { t } = await getServerTranslation(locale, 'modules/maintenance');

  return (
    <>
      <CentralPageHeader
        title={t('detail')}
        description={t('detailDescription')}
        namespace="modules/maintenance"
        icon={<IconTools size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/modules/maintenance/records`, namespace: 'modules/maintenance' },
          { label: 'detail', namespace: 'modules/maintenance' },
        ]}
      />
      <MaintenanceRecordDetail locale={locale} recordId={id} />
    </>
  );
}

