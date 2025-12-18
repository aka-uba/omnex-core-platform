import { CreateStaffPageClient } from './CreateStaffPageClient';

export const dynamic = 'force-dynamic';

export default async function CreateStaffPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateStaffPageClient locale={locale} />;
}








