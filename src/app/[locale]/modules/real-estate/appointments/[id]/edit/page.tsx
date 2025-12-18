import { EditAppointmentPageClient } from './EditAppointmentPageClient';

export const dynamic = 'force-dynamic';

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <EditAppointmentPageClient locale={locale} />;
}








