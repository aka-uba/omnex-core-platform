import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function WebBuilderPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/modules/web-builder/dashboard`);
}
