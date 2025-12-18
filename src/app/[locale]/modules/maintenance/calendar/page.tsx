import { MaintenanceCalendar } from '@/modules/maintenance/components/MaintenanceCalendar';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { getServerTranslation } from '@/lib/i18n/server';

interface MaintenanceCalendarPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MaintenanceCalendarPage({ params }: MaintenanceCalendarPageProps) {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'modules/maintenance');

  return (
    <>
      <CentralPageHeader
        title={t('calendar.title')}
        description={t('calendar.description')}
        namespace="modules/maintenance"
      />
      <MaintenanceCalendar locale={locale} />
    </>
  );
}

