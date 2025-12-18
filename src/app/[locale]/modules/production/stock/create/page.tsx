import { CreateStockMovementPageClient } from './CreateStockMovementPageClient';

export default function CreateStockMovementPage({ params }: { params: { locale: string } }) {
  return <CreateStockMovementPageClient locale={params.locale} />;
}








