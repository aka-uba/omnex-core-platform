import { CreateAppointmentPageClient } from './CreateAppointmentPageClient';

export const dynamic = 'force-dynamic';

export default async function CreateAppointmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateAppointmentPageClient locale={locale} />;
}








