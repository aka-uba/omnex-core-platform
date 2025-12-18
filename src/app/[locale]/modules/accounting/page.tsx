import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountingPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/modules/accounting/dashboard`);
}
