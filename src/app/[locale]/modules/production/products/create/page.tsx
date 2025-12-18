import { CreateProductPageClient } from './CreateProductPageClient';

export default function CreateProductPage({ params }: { params: { locale: string } }) {
  return <CreateProductPageClient locale={params.locale} />;
}








