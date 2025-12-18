import { redirect } from 'next/navigation';

export default async function CodeGeneratorPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/modules/ai/code`);
}
