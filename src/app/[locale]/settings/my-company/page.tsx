import { MyCompanyPageClient } from './MyCompanyPageClient';

export const dynamic = 'force-dynamic';

export default async function MyCompanyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <MyCompanyPageClient locale={locale} />;
}
















