import { SubscriptionsPageClient } from './SubscriptionsPageClient';

export default async function SubscriptionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <SubscriptionsPageClient locale={locale} />;
}








