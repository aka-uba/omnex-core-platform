import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Redirect to campaigns page as the main email page
  redirect(`/${locale}/modules/real-estate/email/campaigns`);
}



