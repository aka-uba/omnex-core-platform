import { ListPageSkeleton } from '@/components/skeletons/ListPageSkeleton';

export function LocationsPageSkeleton() {
  return (
    <ListPageSkeleton
      columns={7}
      rows={5}
      showToolbar={true}
      showHeader={false}
    />
  );
}
