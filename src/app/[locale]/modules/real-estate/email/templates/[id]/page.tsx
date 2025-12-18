import { EmailTemplateDetailPageClient } from './EmailTemplateDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function EmailTemplateDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <EmailTemplateDetailPageClient locale={locale} templateId={id} />;
}
