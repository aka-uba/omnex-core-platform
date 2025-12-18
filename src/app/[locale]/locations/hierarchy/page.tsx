import { LocationHierarchyPageClient } from './LocationHierarchyPageClient';

export default async function LocationHierarchyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LocationHierarchyPageClient locale={locale} />;
}








