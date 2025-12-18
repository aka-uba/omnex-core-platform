import { MaintenanceRecordsPageClient } from './MaintenanceRecordsPageClient';

export default async function MaintenanceRecordsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <MaintenanceRecordsPageClient locale={locale} />;
}








