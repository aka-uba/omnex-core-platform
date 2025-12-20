import { WhatsAppTemplateEditorClient } from './WhatsAppTemplateEditorClient';

export default async function WhatsAppTemplateEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <WhatsAppTemplateEditorClient locale={locale} templateId={id} />;
}
