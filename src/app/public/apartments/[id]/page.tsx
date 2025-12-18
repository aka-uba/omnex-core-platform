import { PublicApartmentViewClient } from './PublicApartmentViewClient';

export const dynamic = 'force-dynamic';

export default async function PublicApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = 'tr'; // Default locale for public pages
  return <PublicApartmentViewClient apartmentId={id} locale={locale} />;
}

