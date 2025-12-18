import { redirect } from 'next/navigation';

export default async function FormsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/modules/web-builder/forms`);
}
