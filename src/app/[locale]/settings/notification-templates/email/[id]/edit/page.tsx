import { EmailTemplateEditorClient } from './EmailTemplateEditorClient';

export default async function EmailTemplateEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <EmailTemplateEditorClient locale={locale} templateId={id} />;
}

