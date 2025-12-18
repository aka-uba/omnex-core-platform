import { redirect } from 'next/navigation';

export default async function CalendarPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/modules/calendar/dashboard`);
}

