'use client';

import { IconUsers, IconActivity, IconCalendar, IconTrendingUp, IconChartBar } from '@tabler/icons-react';
import type { ReportType } from '../../types/report';

interface ReportTypeIconProps {
  type: ReportType | string;
  size?: number;
}

export function ReportTypeIcon({ type, size = 20 }: ReportTypeIconProps) {
  const iconName = typeof type === 'string' ? type : type.icon;
  
  const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    IconUsers: IconUsers,
    IconActivity: IconActivity,
    IconCalendar: IconCalendar,
    IconTrendingUp: IconTrendingUp,
    IconChartBar: IconChartBar,
  };

  const IconComponent = iconMap[iconName] || IconChartBar;

  return <IconComponent size={size} />;
}


