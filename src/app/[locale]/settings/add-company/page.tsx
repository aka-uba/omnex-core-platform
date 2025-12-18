import { TenantCreationWizard } from '../../management/companies/components/TenantCreationWizard';

// Route segment config
export const dynamic = 'force-dynamic';

export default async function AddCompanyPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return <TenantCreationWizard locale={locale} />;
}
