import { NotificationDetail } from '@/modules/notifications/NotificationDetail';

export default async function NotificationDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id } = await params;
    return <NotificationDetail id={id} />;
}






