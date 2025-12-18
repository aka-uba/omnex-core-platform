'use client';

import { Container } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { EmailWizard } from '@/modules/real-estate/components/email/EmailWizard';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useEffect, useState } from 'react';
import type { EmailWizardData } from '@/modules/real-estate/components/email/EmailWizard';
import { useEmailTemplate } from '@/hooks/useEmailTemplates';

export function EmailSendPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation('modules/real-estate');
  const templateId = searchParams.get('templateId');
  const { data: template } = useEmailTemplate(templateId || '');
  
  const [initialData, setInitialData] = useState<Partial<EmailWizardData>>({});
  
  useEffect(() => {
    if (templateId && template) {
      setInitialData({
        templateId,
        template,
      });
    }
  }, [templateId, template]);

  const handleComplete = async (data: EmailWizardData) => {
    try {
      // Send email via API
      const response = await fetch('/api/real-estate/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('email.send.success'),
      });

      router.push(`/${locale}/modules/real-estate/email/templates`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('email.send.error'),
      });
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('email.send.title')}
        description={t('email.send.description')}
        namespace="modules/real-estate"
        icon={<IconMail size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'email.templates.title', href: `/${locale}/modules/real-estate/email/templates`, namespace: 'modules/real-estate' },
          { label: 'email.send.title', namespace: 'modules/real-estate' },
        ]}
      />

      <EmailWizard locale={locale} onComplete={handleComplete} onCancel={handleCancel} initialData={initialData} />
    </Container>
  );
}

