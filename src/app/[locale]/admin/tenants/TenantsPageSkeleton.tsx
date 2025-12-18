'use client';

import { ListPageSkeleton } from '@/components/skeletons';

export function TenantsPageSkeleton() {
  return (
    <ListPageSkeleton
      columns={6}
      rows={8}
      actionsCount={2}
    />
  );
}





