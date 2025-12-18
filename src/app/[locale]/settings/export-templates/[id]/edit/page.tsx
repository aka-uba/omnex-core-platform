import { EditExportTemplatePageClient } from './EditExportTemplatePageClient';

export const dynamic = 'force-dynamic';

export default async function EditExportTemplatePage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale, id } = await params;

    return <EditExportTemplatePageClient locale={locale} templateId={id} />;
}


