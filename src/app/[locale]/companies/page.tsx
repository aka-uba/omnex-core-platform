import { redirect } from 'next/navigation';

// Route segment config
export const dynamic = 'force-dynamic';

export default async function CompaniesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // TODO: Check if user is SuperAdmin
    // For now, redirect to create page as placeholder
    redirect(`/${locale}/companies/create`);
}
