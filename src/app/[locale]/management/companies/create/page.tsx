import { TenantCreationWizard } from '../components/TenantCreationWizard';

// Route segment config
export const dynamic = 'force-dynamic';

export default async function CreateTenantPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return <TenantCreationWizard locale={locale} />;
}
