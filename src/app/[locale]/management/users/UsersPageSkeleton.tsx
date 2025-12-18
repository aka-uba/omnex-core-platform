'use client';

import { ListPageSkeleton } from '@/components/skeletons';

export function UsersPageSkeleton() {
  return (
    <ListPageSkeleton
      columns={6}
      rows={5}
      actionsCount={1}
    />
  );
}



