import { BulkOperationDetailPageClient } from './BulkOperationDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function BulkOperationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <BulkOperationDetailPageClient locale={locale} operationId={id} />;
}
