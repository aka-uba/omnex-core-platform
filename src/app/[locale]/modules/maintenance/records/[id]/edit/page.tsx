import { MaintenanceRecordForm } from '@/modules/maintenance/components/MaintenanceRecordForm';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { getServerTranslation } from '@/lib/i18n/server';

interface EditMaintenanceRecordPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditMaintenanceRecordPage({ params }: EditMaintenanceRecordPageProps) {
  const { locale, id } = await params;
  const { t } = await getServerTranslation(locale, 'modules/maintenance');

  return (
    <>
      <CentralPageHeader
        title={t('edit')}
        description={t('editDescription')}
        namespace="modules/maintenance"
      />
      <MaintenanceRecordForm locale={locale} recordId={id} />
    </>
  );
}

