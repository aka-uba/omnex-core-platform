import { ProductDetailPageClient } from './ProductDetailPageClient';

export default function ProductDetailPage({ params }: { params: { locale: string; id: string } }) {
  return <ProductDetailPageClient locale={params.locale} productId={params.id} />;
}








