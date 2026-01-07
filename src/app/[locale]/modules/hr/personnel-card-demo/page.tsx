import { PersonnelCardDemoClient } from './PersonnelCardDemoClient';

interface PersonnelCardDemoPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PersonnelCardDemoPage({ params }: PersonnelCardDemoPageProps) {
  const { locale } = await params;
  return <PersonnelCardDemoClient locale={locale} />;
}
