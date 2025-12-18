import { MaintenanceRecordList } from '@/modules/maintenance/components/MaintenanceRecordList';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { getServerTranslation } from '@/lib/i18n/server';

interface MaintenanceRecordsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MaintenanceRecordsPage({ params }: MaintenanceRecordsPageProps) {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'modules/maintenance');

  return (
    <>
      <CentralPageHeader
        title={t('title')}
        description={t('description')}
        namespace="modules/maintenance"
      />
      <MaintenanceRecordList locale={locale} />
    </>
  );
}

