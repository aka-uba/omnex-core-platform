import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LicensePage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/modules/license/dashboard`);
}
