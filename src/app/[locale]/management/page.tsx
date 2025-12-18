import { redirect } from 'next/navigation';

export default async function ManagementPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/management/companies`);
}
