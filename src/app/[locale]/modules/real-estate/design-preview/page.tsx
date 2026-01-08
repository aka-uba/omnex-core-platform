import { Metadata } from 'next';
import { DesignPreviewPageClient } from './DesignPreviewPageClient';

export const metadata: Metadata = {
  title: 'Daire Tasarım Karşılaştırma',
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function DesignPreviewPage({ params }: PageProps) {
  const { locale } = await params;
  return <DesignPreviewPageClient locale={locale} />;
}
