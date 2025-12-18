import { OrdersPageClient } from './OrdersPageClient';

export default function OrdersPage({ params }: { params: { locale: string } }) {
  return <OrdersPageClient locale={params.locale} />;
}








