'use client';

import { ListPageSkeleton } from '@/components/skeletons';

export function RolesPageSkeleton() {
  return (
    <ListPageSkeleton
      columns={5}
      rows={4}
      actionsCount={2}
    />
  );
}



