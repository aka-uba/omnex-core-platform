'use client';

import { Container } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { LeaveForm } from '@/modules/hr/components/LeaveForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function CreateLeavePageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('leaves.create')}
        description={t('leaves.createDescription')}
        namespace="modules/hr"
        icon={<IconCalendar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: 'leaves.title', href: `/${currentLocale}/modules/hr/leaves`, namespace: 'modules/hr' },
          { label: 'leaves.create', namespace: 'modules/hr' },
        ]}
      />
      <LeaveForm locale={currentLocale} />
    </Container>
  );
}







