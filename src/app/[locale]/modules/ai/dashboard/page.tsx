'use client';

import { AILayout } from '@/modules/ai/components/layout/AILayout';
import { AIDashboard } from '@/modules/ai/components/dashboard/AIDashboard';

export default function AIDashboardPage() {
  return (
    <AILayout>
      <AIDashboard />
    </AILayout>
  );
}

