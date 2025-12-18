import { EditOrderPageClient } from './EditOrderPageClient';

export default function EditOrderPage({ params }: { params: { locale: string; id: string } }) {
  return <EditOrderPageClient locale={params.locale} orderId={params.id} />;
}








