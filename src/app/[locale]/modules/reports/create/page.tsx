'use client';

import { Container } from '@mantine/core';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { IconChartBar } from '@tabler/icons-react';
import { ReportCreateForm } from '@/modules/raporlar/components/ReportCreateForm';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function CreateReportPage() {
  const params = useParams();
  const locale = params?.locale as string || 'tr';
  const { t } = useTranslation('modules/raporlar');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('actions.create')}
        description={t('create.description')}
        namespace="modules/raporlar"
        icon={<IconChartBar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/raporlar`, namespace: 'modules/raporlar' },
          { label: 'actions.create', namespace: 'modules/raporlar' },
        ]}
      />
      <ReportCreateForm />
    </Container>
  );
}


