'use client';

import { ListPageSkeleton } from '@/components/skeletons';

export function LicensePackagesSkeleton() {
    return (
        <ListPageSkeleton
            columns={8}
            rows={5}
            actionsCount={2}
        />
    );
}
