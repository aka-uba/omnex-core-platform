'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader, Center } from '@mantine/core';

export default function ProfilePage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading } = useAuth();
    const locale = (params?.locale as string) || 'tr';

    useEffect(() => {
        if (!loading) {
            if (user?.id) {
                // Mevcut kullanıcının edit sayfasına yönlendir
                router.replace(`/${locale}/management/users/${user.id}/edit`);
            } else {
                // Kullanıcı yoksa login sayfasına yönlendir
                router.replace(`/${locale}/auth/login`);
            }
        }
    }, [user, loading, locale, router]);

    return (
        <Center h="100vh">
            <Loader size="lg" />
        </Center>
    );
}





