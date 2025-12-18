import { NotificationSettingsPageClient } from './NotificationSettingsPageClient';

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    await params;
    return <NotificationSettingsPageClient />;
}
















