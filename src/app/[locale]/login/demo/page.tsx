'use client';

import { Container, Stack, Paper, Title, Text, Button, Group } from '@mantine/core';
import { IconLogin, IconUserShield } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function LoginDemoPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('global');

  const superAdminHref = '/' + locale + '/login/super-admin';
  const adminHref = '/' + locale + '/login/admin';
  const standardHref = '/' + locale + '/login';

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Paper p="xl" radius="md" withBorder>
          <Title order={2} ta="center" mb="md">
            {t('auth.demo.title')}
          </Title>
          <Text c="dimmed" ta="center" mb="xl">
            {t('auth.demo.description')}
          </Text>

          <Stack gap="md">
            <Paper p="lg" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4} mb="xs">
                    {t('auth.demo.superAdmin.title')}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {t('auth.demo.superAdmin.description')}
                  </Text>
                </div>
                <Button
                  component={Link}
                  href={superAdminHref}
                  leftSection={<IconUserShield size={18} />}
                  variant="filled"
                >
                  {t('auth.demo.superAdmin.button')}
                </Button>
              </Group>
            </Paper>

            <Paper p="lg" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4} mb="xs">
                    {t('auth.demo.admin.title')}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {t('auth.demo.admin.description')}
                  </Text>
                </div>
                <Button
                  component={Link}
                  href={adminHref}
                  leftSection={<IconLogin size={18} />}
                  variant="filled"
                >
                  {t('auth.demo.admin.button')}
                </Button>
              </Group>
            </Paper>

            <Paper p="lg" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4} mb="xs">
                    {t('auth.demo.standard.title')}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {t('auth.demo.standard.description')}
                  </Text>
                </div>
                <Button
                  component={Link}
                  href={standardHref}
                  leftSection={<IconLogin size={18} />}
                  variant="default"
                >
                  {t('auth.demo.standard.button')}
                </Button>
              </Group>
            </Paper>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
