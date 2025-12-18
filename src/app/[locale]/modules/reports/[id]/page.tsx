'use client';

import { useParams } from 'next/navigation';
import { ReportView } from '@/modules/raporlar/components/ReportView';

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params?.id as string;

  if (!reportId) {
    return <div>Rapor ID bulunamadı</div>;
  }

  return <ReportView reportId={reportId} />;
}

