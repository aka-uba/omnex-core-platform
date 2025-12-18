import { CreateBulkOperationPageClient } from './CreateBulkOperationPageClient';

export default async function CreateBulkOperationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CreateBulkOperationPageClient locale={locale} />;
}

