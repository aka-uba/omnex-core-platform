/**
 * Web Builder - SEO Management Panel (FAZ 3)
 * SEO settings for pages
 */

'use client';

import { useState } from 'react';
import { Card, TextInput, Textarea, TagsInput, Button, Stack, Text, Alert } from '@mantine/core';
import { IconInfoCircle, IconSeo } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

export interface SEOSettings {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

interface SEOPanelProps {
  settings: SEOSettings;
  onChange: (settings: SEOSettings) => void;
  onSave?: () => void;
  isLoading?: boolean;
}

export function SEOPanel({ settings, onChange, onSave, isLoading }: SEOPanelProps) {
  const { t } = useTranslation('modules/web-builder');
  const [localSettings, setLocalSettings] = useState<SEOSettings>(settings);

  const handleChange = (field: keyof SEOSettings, value: any) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onChange(updated);
  };

  const titleLength = localSettings.metaTitle?.length || 0;
  const descriptionLength = localSettings.metaDescription?.length || 0;
  const titleWarning = titleLength > 60;
  const descriptionWarning = descriptionLength > 160;

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <IconSeo size={20} />
            <Text fw={600}>
              {t('seo.title')}
            </Text>
          </div>
          <Text c="dimmed">
            {t('seo.description')}
          </Text>
        </div>

        {/* Meta Title */}
        <div>
          <TextInput
            label={t('seo.metaTitle')}
            placeholder={t('seo.metaTitlePlaceholder')}
            value={localSettings.metaTitle || ''}
            onChange={(e) => handleChange('metaTitle', e.target.value)}
            maxLength={70}
            rightSection={
              <Text c={titleWarning ? 'orange' : 'dimmed'}>
                {titleLength}/60
              </Text>
            }
          />
          {titleWarning && (
            <Text c="orange" mt={4}>
              {t('seo.metaTitleWarning')}
            </Text>
          )}
        </div>

        {/* Meta Description */}
        <div>
          <Textarea
            label={t('seo.metaDescription')}
            placeholder={t('seo.metaDescriptionPlaceholder')}
            value={localSettings.metaDescription || ''}
            onChange={(e) => handleChange('metaDescription', e.target.value)}
            maxLength={170}
            minRows={3}
            maxRows={5}
            rightSection={
              <Text c={descriptionWarning ? 'orange' : 'dimmed'} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                {descriptionLength}/160
              </Text>
            }
          />
          {descriptionWarning && (
            <Text c="orange" mt={4}>
              {t('seo.metaDescriptionWarning')}
            </Text>
          )}
        </div>

        {/* Meta Keywords */}
        <div>
          <TagsInput
            label={t('seo.metaKeywords')}
            placeholder={t('seo.metaKeywordsPlaceholder')}
            value={localSettings.metaKeywords || []}
            onChange={(value) => handleChange('metaKeywords', value)}
            maxTags={10}
            description={t('seo.metaKeywordsDescription')}
          />
        </div>

        {/* SEO Tips */}
        <Alert icon={<IconInfoCircle size={16} />} title={t('seo.tipsTitle')} color="blue" variant="light">
          <Stack gap="xs">
            <Text>
              • {t('seo.tips.tip1')}
            </Text>
            <Text>
              • {t('seo.tips.tip2')}
            </Text>
            <Text>
              • {t('seo.tips.tip3')}
            </Text>
            <Text>
              • {t('seo.tips.tip4')}
            </Text>
          </Stack>
        </Alert>

        {/* Save Button */}
        {onSave && (
          <Button
            onClick={onSave}
            loading={isLoading ?? false}
            fullWidth
          >
            {t('seo.saveButton')}
          </Button>
        )}
      </Stack>
    </Card>
  );
}







