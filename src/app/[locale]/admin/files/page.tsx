import { redirect } from 'next/navigation';

export default async function FilesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/modules/file-manager`);
}
