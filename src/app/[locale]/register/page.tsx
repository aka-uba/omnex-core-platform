import { RegisterPageClient } from './RegisterPageClient';

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <RegisterPageClient locale={locale} />;
}





