import { AppointmentDetailPageClient } from './AppointmentDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <AppointmentDetailPageClient locale={locale} />;
}








