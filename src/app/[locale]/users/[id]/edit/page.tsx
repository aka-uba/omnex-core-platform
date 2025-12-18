import { EditUserPageClient } from './EditUserPageClient';

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <EditUserPageClient locale={locale} userId={id} />;
}




