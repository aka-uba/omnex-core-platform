import { EmailTemplatesPageClient } from './EmailTemplatesPageClient';

export default async function EmailTemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <EmailTemplatesPageClient locale={locale} />;
}

