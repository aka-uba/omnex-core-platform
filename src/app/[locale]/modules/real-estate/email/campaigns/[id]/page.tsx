import { EmailCampaignDetailPageClient } from './EmailCampaignDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function EmailCampaignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <EmailCampaignDetailPageClient locale={locale} campaignId={id} />;
}








