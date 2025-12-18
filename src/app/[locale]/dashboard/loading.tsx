import { Container } from '@mantine/core';
import { DashboardSkeleton } from '@/modules/dashboard/components/DashboardSkeleton';

export default function DashboardLoading() {
    return (
        <Container size="xl" pt="xl">
            <DashboardSkeleton />
        </Container>
    );
}


