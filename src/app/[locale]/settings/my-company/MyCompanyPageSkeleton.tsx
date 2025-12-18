'use client';

import { FormPageSkeleton } from '@/components/skeletons';

export function MyCompanyPageSkeleton() {
  return (
    <FormPageSkeleton
      showTabs={true}
      tabsCount={5}
      fieldsCount={8}
      showTextarea={true}
    />
  );
}

