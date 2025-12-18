import { EmailTemplateEditorClient } from '../[id]/edit/EmailTemplateEditorClient';

export default async function EmailTemplateCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <EmailTemplateEditorClient locale={locale} />;
}

