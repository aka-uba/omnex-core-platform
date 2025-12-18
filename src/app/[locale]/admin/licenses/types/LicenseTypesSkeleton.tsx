'use client';

import { ListPageSkeleton } from '@/components/skeletons';

export function LicenseTypesSkeleton() {
    return (
        <ListPageSkeleton
            columns={7}
            rows={5}
            actionsCount={2}
        />
    );
}
