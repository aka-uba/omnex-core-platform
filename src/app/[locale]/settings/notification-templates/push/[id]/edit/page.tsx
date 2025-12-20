import { PushTemplateEditorClient } from './PushTemplateEditorClient';

export default async function PushTemplateEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <PushTemplateEditorClient locale={locale} templateId={id} />;
}
