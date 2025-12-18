import { EmailSendPageClient } from './EmailSendPageClient';

export const dynamic = 'force-dynamic';

export default async function EmailSendPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <EmailSendPageClient locale={locale} />;
}

