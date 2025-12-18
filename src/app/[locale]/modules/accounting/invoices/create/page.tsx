import { CreateInvoicePageClient } from './CreateInvoicePageClient';

export default async function CreateInvoicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CreateInvoicePageClient locale={locale} />;
}








