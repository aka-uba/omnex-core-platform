import { ProductsPageClient } from './ProductsPageClient';

export default function ProductsPage({ params }: { params: { locale: string } }) {
  return <ProductsPageClient locale={params.locale} />;
}








