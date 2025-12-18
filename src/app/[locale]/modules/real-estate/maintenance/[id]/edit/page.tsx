import { getServerTranslation } from '@/lib/i18n/server';
import { MaintenanceRecordForm } from '@/modules/real-estate/components/MaintenanceRecordForm';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { IconTools } from '@tabler/icons-react';
import { Container } from '@mantine/core';

export default async function EditMaintenanceRecordPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { t } = await getServerTranslation(locale, 'modules/real-estate');

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('maintenance.edit.title')}
        description={t('maintenance.edit.description')}
        namespace="modules/real-estate"
        icon={<IconTools size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/real-estate/dashboard`, namespace: 'modules/real-estate' },
          { label: 'maintenance.title', href: `/${locale}/modules/real-estate/maintenance`, namespace: 'modules/real-estate' },
          { label: 'maintenance.edit.title', namespace: 'modules/real-estate' },
        ]}
      />
      <MaintenanceRecordForm locale={locale} recordId={id} />
    </Container>
  );
}








