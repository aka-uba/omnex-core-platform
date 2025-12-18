import { MaintenanceRecordForm } from '@/modules/maintenance/components/MaintenanceRecordForm';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { getServerTranslation } from '@/lib/i18n/server';

interface CreateMaintenanceRecordPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CreateMaintenanceRecordPage({ params }: CreateMaintenanceRecordPageProps) {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'modules/maintenance');

  return (
    <>
      <CentralPageHeader
        title={t('create')}
        description={t('createDescription')}
        namespace="modules/maintenance"
      />
      <MaintenanceRecordForm locale={locale} />
    </>
  );
}

