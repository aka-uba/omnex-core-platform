import { EditProductPageClient } from './EditProductPageClient';

export default function EditProductPage({ params }: { params: { locale: string; id: string } }) {
  return <EditProductPageClient locale={params.locale} productId={params.id} />;
}








