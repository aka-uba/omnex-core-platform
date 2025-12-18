import { LoginPageClient } from './LoginPageClient';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <LoginPageClient locale={locale} />;
}





