import { SubscriptionDetailPageClient } from './SubscriptionDetailPageClient';

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <SubscriptionDetailPageClient locale={locale} subscriptionId={id} />;
}








