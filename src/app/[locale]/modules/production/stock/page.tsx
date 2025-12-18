import { StockPageClient } from './StockPageClient';

export default function StockPage({ params }: { params: { locale: string } }) {
  return <StockPageClient locale={params.locale} />;
}








