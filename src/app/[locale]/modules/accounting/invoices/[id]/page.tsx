import { InvoiceDetailPageClient } from './InvoiceDetailPageClient';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <InvoiceDetailPageClient locale={locale} invoiceId={id} />;
}








