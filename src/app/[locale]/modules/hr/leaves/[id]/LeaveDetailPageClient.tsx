'use client';

import { Container } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { LeaveDetail } from '@/modules/hr/components/LeaveDetail';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export function LeaveDetailPageClient({ locale, leaveId }: { locale: string; leaveId: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/hr');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('leaves.detail')}
        description={t('leaves.detailDescription')}
        namespace="modules/hr"
        icon={<IconCalendar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: 'leaves.title', href: `/${currentLocale}/modules/hr/leaves`, namespace: 'modules/hr' },
          { label: 'leaves.detail', namespace: 'modules/hr' },
        ]}
      />
      <LeaveDetail locale={currentLocale} leaveId={leaveId} />
    </Container>
  );
}







