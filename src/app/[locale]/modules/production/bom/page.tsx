import { BOMPageClient } from './BOMPageClient';

export default function BOMPage({ params }: { params: Promise<{ locale: string }> }) {
  return <BOMPageClient params={params} />;
}







