'use client';

import { FormPageSkeleton } from '@/components/skeletons';

export function EditUserPageSkeleton() {
  return (
    <FormPageSkeleton
      showTabs={true}
      tabsCount={6}
      fieldsCount={8}
      showTextarea={false}
    />
  );
}



