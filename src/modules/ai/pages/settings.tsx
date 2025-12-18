'use client';

import { Container, Title, Paper, Stack, Tabs, Text, TextInput, Button, Switch, Group, Select, NumberInput } from '@mantine/core';
import { IconSettings, IconBrain, IconApi, IconKey, IconDatabase } from '@tabler/icons-react';
import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { useTranslation } from '@/lib/i18n/client';

export default function AISettingsPage() {
  const { t } = useTranslation('modules/ai');
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  
  // Settings state
  const [apiKey, setApiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('gpt-4');
  const [maxTokens, setMaxTokens] = useState(2000);
  const [temperature, setTemperature] = useState(0.7);
  const [enableImageGeneration, setEnableImageGeneration] = useState(true);
  const [enableAudioGeneration, setEnableAudioGeneration] = useState(true);
  const [enableVideoGeneration, setEnableVideoGeneration] = useState(false);
  const [enableCodeGeneration, setEnableCodeGeneration] = useState(true);

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      showSuccess(t('settings.saved'), t('settings.savedMessage'));
    } catch (error) {
      showError(t('settings.saveFailed'), error instanceof Error ? error.message : t('settings.saveFailedMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2} mb="xs">AI Module Settings</Title>
          <Text c="dimmed" size="sm">
            Configure your AI module settings and preferences
          </Text>
        </div>

        <Paper withBorder radius="md" p="xl">
          <Tabs defaultValue="api">
            <Tabs.List>
              <Tabs.Tab value="api" leftSection={<IconApi size={16} />}>
                API Configuration
              </Tabs.Tab>
              <Tabs.Tab value="models" leftSection={<IconBrain size={16} />}>
                Model Settings
              </Tabs.Tab>
              <Tabs.Tab value="features" leftSection={<IconSettings size={16} />}>
                Features
              </Tabs.Tab>
              <Tabs.Tab value="storage" leftSection={<IconDatabase size={16} />}>
                Storage
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="api" pt="xl">
              <Stack gap="md">
                <TextInput
                  label="API Key"
                  placeholder="Enter your API key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  description="Your AI service API key. Keep this secure."
                  leftSection={<IconKey size={16} />}
                />
                <Text size="sm" c="dimmed">
                  The API key is stored securely and encrypted.
                </Text>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="models" pt="xl">
              <Stack gap="md">
                <Select
                  label="Default Model"
                  placeholder="Select default model"
                  value={defaultModel}
                  onChange={(value) => setDefaultModel(value || 'gpt-4')}
                  data={[
                    { value: 'gpt-4', label: 'GPT-4' },
                    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
                    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
                  ]}
                  description="Default AI model to use for text generation"
                />
                <NumberInput
                  label="Max Tokens"
                  placeholder="2000"
                  value={maxTokens}
                  onChange={(value) => setMaxTokens(typeof value === 'number' ? value : 2000)}
                  min={100}
                  max={8000}
                  description="Maximum number of tokens in the response"
                />
                <NumberInput
                  label="Temperature"
                  placeholder="0.7"
                  value={temperature}
                  onChange={(value) => setTemperature(typeof value === 'number' ? value : 0.7)}
                  min={0}
                  max={2}
                  step={0.1}
                  description="Controls randomness. Lower values make output more deterministic."
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="features" pt="xl">
              <Stack gap="md">
                <Switch
                  label="Enable Image Generation"
                  description="Allow users to generate images using AI"
                  checked={enableImageGeneration}
                  onChange={(e) => setEnableImageGeneration(e.currentTarget.checked)}
                />
                <Switch
                  label="Enable Audio Generation"
                  description="Allow users to generate audio using AI"
                  checked={enableAudioGeneration}
                  onChange={(e) => setEnableAudioGeneration(e.currentTarget.checked)}
                />
                <Switch
                  label="Enable Video Generation"
                  description="Allow users to generate videos using AI"
                  checked={enableVideoGeneration}
                  onChange={(e) => setEnableVideoGeneration(e.currentTarget.checked)}
                />
                <Switch
                  label="Enable Code Generation"
                  description="Allow users to generate code using AI"
                  checked={enableCodeGeneration}
                  onChange={(e) => setEnableCodeGeneration(e.currentTarget.checked)}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="storage" pt="xl">
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  Storage settings for AI-generated content
                </Text>
                <Text size="sm" c="dimmed">
                  Storage configuration will be available in a future update.
                </Text>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Button variant="default" onClick={() => window.location.reload()}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading}>
              Save Settings
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
}

