import { PropertiesPageClient } from './PropertiesPageClient';

export const dynamic = 'force-dynamic';

export default async function PropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PropertiesPageClient locale={locale} />;
}






