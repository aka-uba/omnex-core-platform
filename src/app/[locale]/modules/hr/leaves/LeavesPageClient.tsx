'use client';

import { Container } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { LeaveList } from '@/modules/hr/components/LeaveList';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function LeavesPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('leaves.title')}
        description={t('leaves.description')}
        namespace="modules/hr"
        icon={<IconCalendar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: t('title'), href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: t('leaves.title'), namespace: 'modules/hr' },
        ]}
      />
      <LeaveList locale={currentLocale} />
    </Container>
  );
}





