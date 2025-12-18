'use client';

import { Container, Stack, Paper, Title, Text, Button, Group } from '@mantine/core';
import { IconLogin, IconUserShield } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LoginDemoPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Paper p="xl" radius="md" withBorder>
          <Title order={2} ta="center" mb="md">
            Login Sayfaları
          </Title>
          <Text c="dimmed" ta="center" mb="xl">
            Aşağıdaki seçeneklerden birini seçerek login sayfalarını görüntüleyebilirsiniz
          </Text>

          <Stack gap="md">
            <Paper p="lg" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4} mb="xs">
                    Süper Admin Login
                  </Title>
                  <Text size="sm" c="dimmed">
                    Firma seçimi, dönem seçimi ve login formu içeren süper admin giriş sayfası
                  </Text>
                </div>
                <Button
                  component={Link}
                  href={`/${locale}/login/super-admin`}
                  leftSection={<IconUserShield size={18} />}
                  variant="filled"
                >
                  Süper Admin Girişi
                </Button>
              </Group>
            </Paper>

            <Paper p="lg" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4} mb="xs">
                    Normal Admin Login
                  </Title>
                  <Text size="sm" c="dimmed">
                    Dönem seçimi (opsiyonel) ve login formu içeren normal admin giriş sayfası
                  </Text>
                </div>
                <Button
                  component={Link}
                  href={`/${locale}/login/admin`}
                  leftSection={<IconLogin size={18} />}
                  variant="filled"
                >
                  Admin Girişi
                </Button>
              </Group>
            </Paper>

            <Paper p="lg" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4} mb="xs">
                    Standart Login
                  </Title>
                  <Text size="sm" c="dimmed">
                    Mevcut standart login sayfası
                  </Text>
                </div>
                <Button
                  component={Link}
                  href={`/${locale}/login`}
                  leftSection={<IconLogin size={18} />}
                  variant="default"
                >
                  Standart Giriş
                </Button>
              </Group>
            </Paper>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}



