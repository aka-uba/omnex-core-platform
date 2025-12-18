import { InvoicesPageClient } from './InvoicesPageClient';

export default async function InvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <InvoicesPageClient locale={locale} />;
}




