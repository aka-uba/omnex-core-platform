import { PublicApartmentViewClient } from './PublicApartmentViewClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PublicApartmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tenant?: string; locale?: string }>;
}) {
  const { id } = await params;
  const { tenant, locale } = await searchParams;

  // Tenant slug is required for public access
  if (!tenant) {
    redirect('/');
  }

  const selectedLocale = locale || 'tr';

  return (
    <PublicApartmentViewClient
      apartmentId={id}
      locale={selectedLocale}
      tenantSlug={tenant}
    />
  );
}
