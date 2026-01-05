import { MenuManagementPageClient } from './MenuManagementPageClient';

export const dynamic = 'force-dynamic';

export default async function MenuManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // Ensure params is awaited
  
  return <MenuManagementPageClient />;
}


