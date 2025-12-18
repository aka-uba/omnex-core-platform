import { EditTenantPageClient } from './EditTenantPageClient';

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  return <EditTenantPageClient locale={locale} />;
}








