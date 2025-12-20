'use client';

import { FormPageSkeleton } from '@/components/skeletons';

export function SMSTemplateEditorSkeleton() {
  return (
    <FormPageSkeleton
      showTabs={false}
      fieldsCount={6}
      showTextarea={true}
    />
  );
}
