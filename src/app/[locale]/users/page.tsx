import { UsersPageClient } from './UsersPageClient';

// Route segment config
export const dynamic = 'force-dynamic';

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <UsersPageClient locale={locale} />;
}




