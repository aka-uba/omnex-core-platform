import { EditStaffPageClient } from './EditStaffPageClient';

export const dynamic = 'force-dynamic';

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <EditStaffPageClient locale={locale} staffId={id} />;
}








