import { NotificationTemplatesPageClient } from './NotificationTemplatesPageClient';

export default async function NotificationTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <NotificationTemplatesPageClient locale={locale} />;
}

