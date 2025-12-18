import { NotificationsIndex } from '@/modules/notifications/NotificationsIndex';

export default async function NotificationsDashboard({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    return <NotificationsIndex locale={locale} />;
}
