'use client';

import { FormPageSkeleton } from '@/components/skeletons';

export function CreateUserPageSkeleton() {
  return (
    <FormPageSkeleton
      showTabs={true}
      tabsCount={6}
      fieldsCount={8}
      showTextarea={false}
    />
  );
}



