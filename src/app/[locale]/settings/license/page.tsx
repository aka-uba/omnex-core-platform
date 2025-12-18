import { MyLicensePageClient } from './MyLicensePageClient';

export default async function MyLicensePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <MyLicensePageClient locale={locale} />;
}


