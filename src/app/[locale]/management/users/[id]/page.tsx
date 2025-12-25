import { setRequestLocale } from 'next-intl/server';
import { UserDetailPageClient } from './UserDetailPageClient';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <UserDetailPageClient locale={locale} userId={id} />;
}
