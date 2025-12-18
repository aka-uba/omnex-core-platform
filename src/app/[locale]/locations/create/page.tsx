import { CreateLocationPageClient } from './CreateLocationPageClient';

export default async function CreateLocationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateLocationPageClient locale={locale} />;
}








