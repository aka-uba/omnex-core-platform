'use client';

import { Badge } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import type { ReportStatus } from '../../types/report';

interface ReportStatusBadgeProps {
  status: ReportStatus;
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const { t } = useTranslation('modules/raporlar');
  
  const getStatusConfig = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return { color: 'green', label: t('status.completed') };
      case 'generating':
        return { color: 'blue', label: t('status.generating') };
      case 'pending':
        return { color: 'yellow', label: t('status.pending') };
      case 'failed':
        return { color: 'red', label: t('status.failed') };
      default:
        return { color: 'gray', label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge color={config.color} variant="light">
      {config.label}
    </Badge>
  );
}


