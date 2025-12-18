import { CreateSubscriptionPageClient } from './CreateSubscriptionPageClient';

export default async function CreateSubscriptionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CreateSubscriptionPageClient locale={locale} />;
}








