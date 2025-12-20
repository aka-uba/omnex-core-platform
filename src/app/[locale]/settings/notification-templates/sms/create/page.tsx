import { SMSTemplateEditorClient } from '../[id]/edit/SMSTemplateEditorClient';

export default async function SMSTemplateCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <SMSTemplateEditorClient locale={locale} />;
}
