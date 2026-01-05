import { FooterCustomizationPageClient } from './FooterCustomizationPageClient';

export const dynamic = 'force-dynamic';

export default async function FooterCustomizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // Ensure params is awaited
  
  return <FooterCustomizationPageClient />;
}
