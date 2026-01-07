'use client';

import { useState } from 'react';
import { Container, Title, Text, Paper, Badge, Group, SegmentedControl, Box, Divider, ThemeIcon } from '@mantine/core';
import { IconUsers, IconLayoutDashboard, IconLayoutList, IconTimeline } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { PersonnelCardV1 } from './designs/PersonnelCardV1';
import { PersonnelCardV2 } from './designs/PersonnelCardV2';
import { PersonnelCardV3 } from './designs/PersonnelCardV3';

export function PersonnelCardDemoClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const [selectedDesign, setSelectedDesign] = useState<string>('all');

  const designs = [
    { value: 'all', label: 'Tümü' },
    { value: 'v1', label: 'V1 - Modüler' },
    { value: 'v2', label: 'V2 - Sekmeli' },
    { value: 'v3', label: 'V3 - Timeline' },
  ];

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="Personel Kartı Tasarım Demo"
        description="Müşteri deneyimi için 3 farklı personel kartı tasarımı karşılaştırması"
        namespace="modules/hr"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'Human Resources', href: `/${currentLocale}/modules/hr`, namespace: 'modules/hr' },
          { label: 'Personel Kartı Demo', namespace: 'modules/hr' },
        ]}
      />

      <Paper shadow="xs" p="md" mt="md" radius="md">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={4}>Tasarım Seçimi</Title>
            <Text size="sm" c="dimmed">Görüntülemek istediğiniz tasarımı seçin</Text>
          </div>
          <SegmentedControl
            value={selectedDesign}
            onChange={setSelectedDesign}
            data={designs}
          />
        </Group>
      </Paper>

      {/* V1 - Modular Card Design */}
      {(selectedDesign === 'all' || selectedDesign === 'v1') && (
        <Box mt="xl">
          <Group mb="md" gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconLayoutDashboard size={20} />
            </ThemeIcon>
            <div>
              <Group gap="xs">
                <Title order={3}>V1 - Modüler Kart Tasarımı</Title>
                <Badge variant="light" color="blue">Modüler</Badge>
              </Group>
              <Text size="sm" c="dimmed">Sol tarafta profil, sağda detay tabloları ve takvim görünümü</Text>
            </div>
          </Group>
          <PersonnelCardV1 />
        </Box>
      )}

      {/* Divider between designs */}
      {selectedDesign === 'all' && <Divider my="xl" size="md" label="Tasarım Karşılaştırması" labelPosition="center" />}

      {/* V2 - Tabbed Card Design */}
      {(selectedDesign === 'all' || selectedDesign === 'v2') && (
        <Box mt="xl">
          <Group mb="md" gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="green">
              <IconLayoutList size={20} />
            </ThemeIcon>
            <div>
              <Group gap="xs">
                <Title order={3}>V2 - Sekmeli Kart Tasarımı</Title>
                <Badge variant="light" color="green">Sekmeli</Badge>
              </Group>
              <Text size="sm" c="dimmed">Üst profil alanı ve sekme bazlı içerik organizasyonu</Text>
            </div>
          </Group>
          <PersonnelCardV2 />
        </Box>
      )}

      {/* Divider between designs */}
      {selectedDesign === 'all' && <Divider my="xl" size="md" label="Tasarım Karşılaştırması" labelPosition="center" />}

      {/* V3 - Timeline Design */}
      {(selectedDesign === 'all' || selectedDesign === 'v3') && (
        <Box mt="xl">
          <Group mb="md" gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="orange">
              <IconTimeline size={20} />
            </ThemeIcon>
            <div>
              <Group gap="xs">
                <Title order={3}>V3 - Timeline Tasarımı</Title>
                <Badge variant="light" color="orange">Timeline</Badge>
              </Group>
              <Text size="sm" c="dimmed">Yatay timeline ve açılır/kapanır bölümlerle modern görünüm</Text>
            </div>
          </Group>
          <PersonnelCardV3 />
        </Box>
      )}
    </Container>
  );
}
