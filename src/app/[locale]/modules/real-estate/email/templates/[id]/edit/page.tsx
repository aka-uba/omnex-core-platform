import { EditEmailTemplatePageClient } from './EditEmailTemplatePageClient';

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <EditEmailTemplatePageClient locale={locale} templateId={id} />;
}

