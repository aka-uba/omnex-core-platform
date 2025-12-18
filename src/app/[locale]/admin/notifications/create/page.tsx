import { redirect } from 'next/navigation';

export default async function CreateNotificationPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/modules/notifications/create`);
}
