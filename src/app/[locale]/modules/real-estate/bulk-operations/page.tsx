import { BulkOperationsPageClient } from './BulkOperationsPageClient';

export default async function BulkOperationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <BulkOperationsPageClient locale={locale} />;
}

