'use client';

import { useState } from 'react';
import { Stepper, Button, Group, Paper, Stack } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { EmailWizardStep1 } from './EmailWizardStep1';
import { EmailWizardStep2 } from './EmailWizardStep2';
import { EmailWizardStep3 } from './EmailWizardStep3';
import { EmailWizardStep4 } from './EmailWizardStep4';
import { EmailWizardStep5 } from './EmailWizardStep5';
import { EmailWizardStep6 } from './EmailWizardStep6';
import type { EmailTemplate } from '@/modules/real-estate/types/email-template';
import type { Apartment } from '@/modules/real-estate/types/apartment';

export interface EmailWizardData {
  // Step 1: Recipients
  recipients: Array<{
    email: string;
    name?: string;
    type?: 'tenant' | 'contact' | 'manual';
  }>;
  
  // Step 2: Template
  templateId?: string;
  template?: EmailTemplate;
  
  // Step 3: Apartment
  apartmentId?: string;
  apartment?: Apartment;
  
  // Step 4: Content
  customSubject?: string;
  customContent?: string;
  variables?: Record<string, any>;
  
  // Step 5: Preview & Test
  testEmail?: string;
  
  // Step 6: Send
  scheduledAt?: Date;
  sendNow?: boolean;
}

interface EmailWizardProps {
  locale: string;
  onComplete?: (data: EmailWizardData) => void;
  onCancel?: () => void;
  initialData?: Partial<EmailWizardData>;
}

export function EmailWizard({ locale, onComplete, onCancel, initialData }: EmailWizardProps) {
  const { t } = useTranslation('modules/real-estate');
  const [active, setActive] = useState(initialData?.templateId ? 1 : 0); // Start at step 2 if template is pre-selected
  const [wizardData, setWizardData] = useState<EmailWizardData>({
    recipients: [],
    variables: {},
    ...initialData,
  });

  const updateWizardData = (updates: Partial<EmailWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (active < 5) {
      setActive((current) => current + 1);
    } else {
      // Final step - complete
      onComplete?.(wizardData);
    }
  };

  const prevStep = () => {
    if (active > 0) {
      setActive((current) => current - 1);
    }
  };

  const canProceed = () => {
    switch (active) {
      case 0: // Recipients
        return wizardData.recipients.length > 0;
      case 1: // Template
        return !!wizardData.templateId;
      case 2: // Apartment (optional)
        return true;
      case 3: // Content
        return true;
      case 4: // Preview
        return true;
      case 5: // Send
        return true;
      default:
        return false;
    }
  };

  return (
    <Paper shadow="xs" p="xl">
      <Stack gap="xl">
        <Stepper active={active} onStepClick={setActive}>
          <Stepper.Step
            label={t('email.wizard.step1.title')}
            description={t('email.wizard.step1.description')}
          />
          <Stepper.Step
            label={t('email.wizard.step2.title')}
            description={t('email.wizard.step2.description')}
          />
          <Stepper.Step
            label={t('email.wizard.step3.title')}
            description={t('email.wizard.step3.description')}
          />
          <Stepper.Step
            label={t('email.wizard.step4.title')}
            description={t('email.wizard.step4.description')}
          />
          <Stepper.Step
            label={t('email.wizard.step5.title')}
            description={t('email.wizard.step5.description')}
          />
          <Stepper.Step
            label={t('email.wizard.step6.title')}
            description={t('email.wizard.step6.description')}
          />
        </Stepper>

        <Paper p="md" withBorder>
          {active === 0 && (
            <EmailWizardStep1
              locale={locale}
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}
          {active === 1 && (
            <EmailWizardStep2
              locale={locale}
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}
          {active === 2 && (
            <EmailWizardStep3
              locale={locale}
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}
          {active === 3 && (
            <EmailWizardStep4
              locale={locale}
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}
          {active === 4 && (
            <EmailWizardStep5
              locale={locale}
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}
          {active === 5 && (
            <EmailWizardStep6
              locale={locale}
              data={wizardData}
              onUpdate={updateWizardData}
            />
          )}
        </Paper>

        <Group justify="space-between">
          <Button variant="subtle" onClick={onCancel || prevStep}>
            {active === 0 ? (t('actions.cancel')) : (t('actions.back'))}
          </Button>
          <Group>
            {active > 0 && (
              <Button variant="default" onClick={prevStep}>
                {t('actions.previous')}
              </Button>
            )}
            <Button onClick={nextStep} disabled={!canProceed()}>
              {active === 5 ? (t('email.wizard.send')) : (t('actions.next'))}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}

