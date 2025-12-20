import { TelegramTemplateEditorClient } from './TelegramTemplateEditorClient';

export default async function TelegramTemplateEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <TelegramTemplateEditorClient locale={locale} templateId={id} />;
}
