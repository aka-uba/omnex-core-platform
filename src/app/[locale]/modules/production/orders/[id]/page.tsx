import { OrderDetailPageClient } from './OrderDetailPageClient';

export default function OrderDetailPage({ params }: { params: { locale: string; id: string } }) {
  return <OrderDetailPageClient locale={params.locale} orderId={params.id} />;
}








