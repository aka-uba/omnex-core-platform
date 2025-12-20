import { SMSTemplateEditorClient } from './SMSTemplateEditorClient';

export default async function SMSTemplateEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <SMSTemplateEditorClient locale={locale} templateId={id} />;
}
