import { EmailCampaignsPageClient } from './EmailCampaignsPageClient';

export const dynamic = 'force-dynamic';

export default async function EmailCampaignsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <EmailCampaignsPageClient locale={locale} />;
}








