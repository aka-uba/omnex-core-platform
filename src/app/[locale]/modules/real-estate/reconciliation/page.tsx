import { ReconciliationPageClient } from './ReconciliationPageClient';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ReconciliationPage({ params }: PageProps) {
  const { locale } = await params;
  return <ReconciliationPageClient locale={locale} />;
}
