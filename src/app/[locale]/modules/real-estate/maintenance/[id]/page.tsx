import { MaintenanceRecordDetail } from '@/modules/real-estate/components/MaintenanceRecordDetail';
// Unused imports removed
import { Container } from '@mantine/core';
import { MaintenanceRecordDetailHeader } from '@/modules/real-estate/components/MaintenanceRecordDetailHeader';

export default async function MaintenanceRecordDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return (
    <Container size="xl" pt="xl">
      <MaintenanceRecordDetailHeader locale={locale} recordId={id} />
      <MaintenanceRecordDetail locale={locale} recordId={id} />
    </Container>
  );
}








