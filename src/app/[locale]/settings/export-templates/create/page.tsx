import { CreateExportTemplatePageClient } from './CreateExportTemplatePageClient';

export const dynamic = 'force-dynamic';

export default async function CreateExportTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <CreateExportTemplatePageClient locale={locale} />;
}


