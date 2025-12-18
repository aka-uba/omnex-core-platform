import { EditSubscriptionPageClient } from './EditSubscriptionPageClient';

export default async function EditSubscriptionPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <EditSubscriptionPageClient locale={locale} subscriptionId={id} />;
}








