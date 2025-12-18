import { redirect } from 'next/navigation';

export default async function AIPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/modules/ai/dashboard`);
}
