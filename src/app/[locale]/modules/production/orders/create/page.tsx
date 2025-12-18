import { CreateOrderPageClient } from './CreateOrderPageClient';

export default function CreateOrderPage({ params }: { params: { locale: string } }) {
  return <CreateOrderPageClient locale={params.locale} />;
}








