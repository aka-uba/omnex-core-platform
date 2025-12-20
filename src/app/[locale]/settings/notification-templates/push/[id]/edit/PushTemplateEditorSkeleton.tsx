'use client';

import { FormPageSkeleton } from '@/components/skeletons';

export function PushTemplateEditorSkeleton() {
  return (
    <FormPageSkeleton
      showTabs={false}
      fieldsCount={8}
      showTextarea={true}
    />
  );
}
