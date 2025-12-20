import { WhatsAppTemplateEditorClient } from '../[id]/edit/WhatsAppTemplateEditorClient';

export default async function WhatsAppTemplateCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <WhatsAppTemplateEditorClient locale={locale} />;
}
