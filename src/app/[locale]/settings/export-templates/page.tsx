import { ExportTemplatesPageClient } from './ExportTemplatesPageClient';

// Route segment config
export const dynamic = 'force-dynamic';

export default async function ExportTemplatesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return <ExportTemplatesPageClient locale={locale} />;
}


