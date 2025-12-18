import { Suspense } from 'react';
import { Container } from '@mantine/core';
import { Dashboard } from '@/modules/dashboard/Dashboard';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';

// Route segment config
export const dynamic = 'auto';
export const revalidate = 3600; // Revalidate every hour

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <Container size="xl" pt="xl">
                    <DashboardSkeleton />
                </Container>
            }
        >
            <Dashboard />
        </Suspense>
    );
}
