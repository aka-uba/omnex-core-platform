import { TelegramTemplateEditorClient } from '../[id]/edit/TelegramTemplateEditorClient';

export default async function TelegramTemplateCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <TelegramTemplateEditorClient locale={locale} />;
}
