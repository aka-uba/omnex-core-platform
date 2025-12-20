import { PushTemplateEditorClient } from '../[id]/edit/PushTemplateEditorClient';

export default async function PushTemplateCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <PushTemplateEditorClient locale={locale} />;
}
