'use client';

import { FormPageSkeleton } from '@/components/skeletons';

export function EmailTemplateEditorSkeleton() {
  return (
    <FormPageSkeleton
      showTabs={true}
      tabsCount={4}
      fieldsCount={6}
      showTextarea={true}
    />
  );
}






