import { GeneralSettingsPageClient } from './GeneralSettingsPageClient';

export const dynamic = 'force-dynamic';

export default async function GeneralSettingsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    
    return <GeneralSettingsPageClient locale={locale} />;
}
















