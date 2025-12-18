import { getServerTranslation } from '@/lib/i18n/server';
import { MaintenanceRecordForm } from '@/modules/real-estate/components/MaintenanceRecordForm';

export default async function CreateMaintenanceRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ apartmentId?: string }>;
}) {
  const { locale } = await params;
  const { apartmentId } = await searchParams;
  const { t } = await getServerTranslation(locale, 'modules/real-estate');

  return (
    <div>
      <h1>{t('maintenance.create.title')}</h1>
      <MaintenanceRecordForm locale={locale} {...(apartmentId ? { apartmentId } : {})} />
    </div>
  );
}








