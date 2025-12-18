import { redirect } from 'next/navigation';

export default function LocationsRedirect({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/settings/company/locations`);
}
