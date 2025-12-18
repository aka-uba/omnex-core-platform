import { redirect } from 'next/navigation';

export default async function EditNotificationPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id, locale } = await params;
    redirect(`/${locale}/modules/notifications/${id}/edit`);
}
