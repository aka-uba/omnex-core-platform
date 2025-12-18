import { CreateEmailTemplatePageClient } from './CreateEmailTemplatePageClient';

export default async function CreateEmailTemplatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CreateEmailTemplatePageClient locale={locale} />;
}

