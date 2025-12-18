import { NotificationEdit } from '@/modules/notifications/NotificationEdit';

export default async function EditNotificationPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id } = await params;
    return <NotificationEdit id={id} />;
}






