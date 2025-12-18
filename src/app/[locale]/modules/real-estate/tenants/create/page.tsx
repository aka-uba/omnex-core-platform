import { CreateTenantPageClient } from './CreateTenantPageClient';

export default async function CreateTenantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateTenantPageClient locale={locale} />;
}








