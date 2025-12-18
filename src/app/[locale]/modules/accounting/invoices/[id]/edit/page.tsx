import { EditInvoicePageClient } from './EditInvoicePageClient';

export default async function EditInvoicePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <EditInvoicePageClient locale={locale} invoiceId={id} />;
}








