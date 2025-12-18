import { CreateUserPageClient } from './CreateUserPageClient';

export default async function CreateUserPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <CreateUserPageClient locale={locale} />;
}




