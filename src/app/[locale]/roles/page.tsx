import { RolesPageClient } from './RolesPageClient';

export default async function RolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RolesPageClient locale={locale} />;
}




