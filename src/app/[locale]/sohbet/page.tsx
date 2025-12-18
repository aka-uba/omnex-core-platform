import { redirect } from 'next/navigation';

export default async function SohbetPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/modules/sohbet/dashboard`);
}





