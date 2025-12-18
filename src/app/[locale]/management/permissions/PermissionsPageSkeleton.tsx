'use client';

import { ListPageSkeleton } from '@/components/skeletons';

export function PermissionsPageSkeleton() {
  return (
    <ListPageSkeleton
      columns={5}
      rows={5}
      actionsCount={3}
    />
  );
}



