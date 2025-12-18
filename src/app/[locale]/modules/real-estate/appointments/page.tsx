import { AppointmentsPageClient } from './AppointmentsPageClient';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AppointmentsPageClient locale={locale} />;
}








