import { CreatePropertyPageClient } from './CreatePropertyPageClient';

export default async function CreatePropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreatePropertyPageClient locale={locale} />;
}








