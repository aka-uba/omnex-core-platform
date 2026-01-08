'use client';

import { useState, useMemo } from 'react';
import {
  Grid,
  Paper,
  Image,
  Box,
  Text,
  Title,
  Badge,
  Group,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Tabs,
  Collapse,
  UnstyledButton,
  Progress,
  Checkbox,
  Alert,
} from '@mantine/core';
import {
  IconHome,
  IconBath,
  IconCurrencyEuro,
  IconBolt,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconX,
  IconPhoto,
  IconCar,
  IconToolsKitchen2,
  IconBalloon,
  IconElevator,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useCurrency } from '@/hooks/useCurrency';

interface ApartmentDesignV2Props {
  apartment: any;
  locale: string;
}

export function ApartmentDesignV2({ apartment, locale }: ApartmentDesignV2Props) {
  const { formatCurrency } = useCurrency();
  const [financialOpen, setFinancialOpen] = useState(true);
  const [energyOpen, setEnergyOpen] = useState(false);

  const coverImageUrl = useMemo(() => {
    if (apartment.coverImage) {
      return `/api/core-files/${apartment.coverImage}/download?inline=true`;
    }
    if (apartment.images && apartment.images.length > 0) {
      return `/api/core-files/${apartment.images[0]}/download?inline=true`;
    }
    return null;
  }, [apartment]);

  const coldRent = Number(apartment.coldRent) || 0;
  const additionalCosts = Number(apartment.additionalCosts) || 0;
  const heatingCosts = Number(apartment.heatingCosts) || 0;
  const totalRent = coldRent + additionalCosts + heatingCosts;
  const deposit = Number(apartment.deposit) || coldRent * 3;

  const features = [
    { label: 'Otopark', available: apartment.hasParkingSpot, icon: IconCar },
    { label: 'Ankastre Mutfak', available: apartment.hasFittedKitchen, icon: IconToolsKitchen2 },
    { label: 'Balkon', available: apartment.hasBalcony, icon: IconBalloon },
    { label: 'Küvet', available: apartment.hasBathtub, icon: IconBath },
    { label: 'Bodrum', available: apartment.hasBasement, icon: IconHome },
    { label: 'Asansör', available: apartment.hasElevator, icon: IconElevator },
    { label: 'Bahçe Erişimi', available: false, icon: IconHome },
    { label: 'Misafir WC', available: false, icon: IconBath },
    { label: 'Akıllı Ev', available: false, icon: IconHome },
  ];

  return (
    <Paper shadow="xs" radius="md" withBorder>
      <Grid gutter={0}>
        {/* Sol Panel */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Stack gap="md" p="md">
            {/* Ana Görsel */}
            <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
              <Box pos="relative" h={{ base: 256, sm: 320, lg: 384 }}>
                {coverImageUrl ? (
                  <Image
                    src={coverImageUrl}
                    alt={apartment.unitNumber}
                    h="100%"
                    fit="cover"
                    style={{ transition: 'transform 0.7s ease' }}
                  />
                ) : (
                  <Box
                    h="100%"
                    bg="gray.2"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IconHome size={48} color="gray" />
                  </Box>
                )}
                {/* Üst Sağ İkonlar */}
                <Stack pos="absolute" top={16} right={16} gap="xs">
                  <Paper p="xs" radius="md" bg="white" style={{ opacity: 0.9 }}>
                    <IconPhoto size={20} />
                  </Paper>
                </Stack>
                {/* Alt Gradient */}
                <Box
                  pos="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  p="lg"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                  }}
                >
                  <Title order={3} c="white">Daire Önizleme</Title>
                  <Text size="sm" c="gray.3">2 gün önce güncellendi</Text>
                </Box>
              </Box>
            </Paper>

            {/* Hızlı Özet */}
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">Hızlı Özet</Text>
              <SimpleGrid cols={2} spacing="sm">
                <Paper p="sm" radius="sm" bg="gray.0" withBorder>
                  <Text size="xs" c="dimmed">Toplam Alan</Text>
                  <Text size="lg" fw={700}>{apartment.area || '-'} m²</Text>
                </Paper>
                <Paper p="sm" radius="sm" bg="gray.0" withBorder>
                  <Text size="xs" c="dimmed">Oda Sayısı</Text>
                  <Text size="lg" fw={700}>{apartment.roomCount || '-'}</Text>
                </Paper>
                <Paper p="sm" radius="sm" bg="gray.0" withBorder>
                  <Text size="xs" c="dimmed">Kat</Text>
                  <Text size="lg" fw={700}>{apartment.floor || '-'}. (DG)</Text>
                </Paper>
                <Paper p="sm" radius="sm" bg="gray.0" withBorder>
                  <Text size="xs" c="dimmed">Tip</Text>
                  <Text size="lg" fw={700}>{apartment.apartmentType || 'Penthouse'}</Text>
                </Paper>
              </SimpleGrid>
              <Group gap="xs" mt="md">
                <Badge variant="dot" color="green" size="sm">Salon</Badge>
                <Badge variant="dot" color="grape" size="sm">Balkon</Badge>
                <Badge variant="dot" color="indigo" size="sm">Yenilenmiş</Badge>
              </Group>
            </Paper>

            {/* Maliyet Özeti - Sol tarafa eklendi */}
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">Aylık Maliyet Özeti</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Net Kira</Text>
                  <Text size="sm" fw={600}>{formatCurrency(coldRent)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Yan Giderler</Text>
                  <Text size="sm" fw={600}>{formatCurrency(additionalCosts)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Isıtma</Text>
                  <Text size="sm" fw={600}>{formatCurrency(heatingCosts)}</Text>
                </Group>
                <Paper p="sm" bg="blue.0" radius="sm" mt="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={600} c="blue">Toplam Sıcak Kira</Text>
                    <Text size="lg" fw={700} c="blue">{formatCurrency(totalRent)}</Text>
                  </Group>
                </Paper>
              </Stack>
            </Paper>

            {/* Ek Bilgiler */}
            <Paper p="md" radius="md" withBorder bg="gray.0">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">Enerji Verileri</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Tüketim</Text>
                  <Text size="sm" fw={600} c="orange">124 kWh/(m²*a)</Text>
                </Group>
                <Progress.Root size="sm">
                  <Progress.Section value={15} color="green" />
                  <Progress.Section value={15} color="lime" />
                  <Progress.Section value={15} color="yellow" />
                  <Progress.Section value={20} color="orange" />
                  <Progress.Section value={15} color="red" style={{ opacity: 0.3 }} />
                  <Progress.Section value={20} color="red.8" style={{ opacity: 0.3 }} />
                </Progress.Root>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">A+</Text>
                  <Text size="xs" c="dimmed">D</Text>
                  <Text size="xs" c="dimmed">H</Text>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Sağ Panel - Tab Yapısı */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper h="100%" radius={0} style={{ display: 'flex', flexDirection: 'column' }}>
            <Tabs defaultValue="overview" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Tabs.List px="md" pt="md">
                <Tabs.Tab value="overview">Genel Bakış</Tabs.Tab>
                <Tabs.Tab value="costs">Maliyetler & Finans</Tabs.Tab>
                <Tabs.Tab value="documents">Belgeler</Tabs.Tab>
                <Tabs.Tab value="history">Geçmiş</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="overview" p="md" style={{ flex: 1, overflow: 'auto' }}>
                <Stack gap="lg">
                  {/* Ana Veriler */}
                  <Box>
                    <Group gap="xs" mb="md">
                      <ThemeIcon variant="light" color="blue" size="sm">
                        <IconHome size={14} />
                      </ThemeIcon>
                      <Text fw={600}>Ana Veriler</Text>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Daire No.</Text>
                        <Text size="md" fw={500} pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          {apartment.unitNumber || '-'}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Daire Tipi</Text>
                        <Text size="md" fw={500} pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          {apartment.apartmentType || 'Çatı Katı (Dachgeschoss)'}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Yaşam Alanı</Text>
                        <Text size="md" fw={500} pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          {apartment.area || '-'} m²
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Oda Sayısı</Text>
                        <Text size="md" fw={500} pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          {apartment.roomCount || '-'}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Yatak Odası</Text>
                        <Text size="md" fw={500} pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          {apartment.bedroomCount || '-'}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Banyo</Text>
                        <Text size="md" fw={500} pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          {apartment.bathroomCount || '-'}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>İnternet Hızı</Text>
                        <Text size="md" fw={500} pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          {apartment.internetSpeed || 'Fiber (1000 Mbit)'}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Son Yenileme</Text>
                        <Text size="md" fw={500} pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                          {apartment.lastRenovationDate ? new Date(apartment.lastRenovationDate).toLocaleDateString('tr-TR') : '-'}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  {/* Finansal Özet - Collapse */}
                  <Paper radius="md" withBorder bg="gray.0">
                    <UnstyledButton
                      onClick={() => setFinancialOpen(!financialOpen)}
                      w="100%"
                      p="md"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Group gap="xs">
                        <ThemeIcon variant="light" color="green" size="sm">
                          <IconCurrencyEuro size={14} />
                        </ThemeIcon>
                        <Text fw={600}>Finansal Özet (Aylık)</Text>
                      </Group>
                      {financialOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </UnstyledButton>
                    <Collapse in={financialOpen}>
                      <Box p="md" pt={0}>
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="md">
                          <Paper p="sm" bg="white" radius="sm" withBorder>
                            <Text size="xs" c="dimmed">Net Kira (Kaltmiete)</Text>
                            <Text size="lg" fw={600}>{formatCurrency(coldRent)}</Text>
                          </Paper>
                          <Paper p="sm" bg="white" radius="sm" withBorder>
                            <Text size="xs" c="dimmed">Yan Giderler (Nebenkosten)</Text>
                            <Text size="lg" fw={600}>{formatCurrency(additionalCosts)}</Text>
                          </Paper>
                          <Paper p="sm" bg="white" radius="sm" withBorder>
                            <Text size="xs" c="dimmed">Isıtma (Heizkosten)</Text>
                            <Text size="lg" fw={600}>{formatCurrency(heatingCosts)}</Text>
                          </Paper>
                        </SimpleGrid>
                        <Paper p="sm" bg="white" radius="sm" withBorder>
                          <Group justify="space-between">
                            <Text size="sm" fw={500}>Toplam Sıcak Kira</Text>
                            <Text size="xl" fw={700} c="blue">{formatCurrency(totalRent)}</Text>
                          </Group>
                        </Paper>
                        <Group justify="space-between" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                          <Text size="sm" c="dimmed">Depozito (Kaution)</Text>
                          <Text size="sm" fw={500}>{formatCurrency(deposit)} (Tek seferlik)</Text>
                        </Group>
                      </Box>
                    </Collapse>
                  </Paper>

                  {/* Enerji & Isıtma - Collapse */}
                  <Paper radius="md" withBorder>
                    <UnstyledButton
                      onClick={() => setEnergyOpen(!energyOpen)}
                      w="100%"
                      p="md"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Group gap="xs">
                        <ThemeIcon variant="light" color="orange" size="sm">
                          <IconBolt size={14} />
                        </ThemeIcon>
                        <Text fw={600}>Enerji & Isıtma</Text>
                      </Group>
                      {energyOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </UnstyledButton>
                    <Collapse in={energyOpen}>
                      <Box p="md" pt={0}>
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                          <Box>
                            <Text size="sm" fw={500} mb="sm">Isıtma Sistemleri</Text>
                            <Stack gap="xs">
                              <Group gap="xs">
                                <IconCheck size={14} color="green" />
                                <Text size="sm">Birincil: Merkezi Gaz Isıtma</Text>
                              </Group>
                              <Group gap="xs">
                                <IconX size={14} color="gray" />
                                <Text size="sm" c="dimmed">İkincil: Yok</Text>
                              </Group>
                            </Stack>
                          </Box>
                          <Box>
                            <Text size="sm" fw={500} mb="sm">Enerji Verimliliği</Text>
                            <Paper p="sm" bg="gray.0" radius="sm" withBorder>
                              <Group justify="space-between">
                                <Text size="sm" c="dimmed">Tüketim</Text>
                                <Text size="sm" fw={700} c="orange">124 kWh/(m²*a)</Text>
                              </Group>
                            </Paper>
                          </Box>
                        </SimpleGrid>
                      </Box>
                    </Collapse>
                  </Paper>

                  {/* Özellikler & Olanaklar */}
                  <Box>
                    <Group gap="xs" mb="md">
                      <ThemeIcon variant="light" color="blue" size="sm">
                        <IconCheck size={14} />
                      </ThemeIcon>
                      <Text fw={600}>Özellikler & Olanaklar</Text>
                    </Group>
                    <Paper p="md" radius="md" bg="gray.0" withBorder>
                      <SimpleGrid cols={{ base: 2, md: 3 }} spacing="sm">
                        {features.map((feature, index) => (
                          <Group key={index} gap="xs">
                            <Checkbox
                              checked={feature.available}
                              readOnly
                              size="xs"
                              color={feature.available ? 'green' : 'gray'}
                              styles={{
                                input: { cursor: 'default' },
                                label: { opacity: feature.available ? 1 : 0.5 },
                              }}
                              label={feature.label}
                            />
                          </Group>
                        ))}
                      </SimpleGrid>
                      <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                        <UnstyledButton>
                          <Text size="sm" c="blue" fw={500}>Tüm 47 özelliği göster →</Text>
                        </UnstyledButton>
                      </Box>
                    </Paper>
                  </Box>

                  {/* Ek Notlar */}
                  <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
                    <Text size="sm">
                      Kiracı 31.05.2024 tarihinde taşınacak. 1 Nisan'dan itibaren gösterimler mümkün.
                      Lütfen mülk yönetimi ile önceden koordine edin.
                    </Text>
                  </Alert>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="costs" p="md">
                <Text c="dimmed">Maliyetler ve Finans detayları...</Text>
              </Tabs.Panel>

              <Tabs.Panel value="documents" p="md">
                <Text c="dimmed">Belgeler listesi...</Text>
              </Tabs.Panel>

              <Tabs.Panel value="history" p="md">
                <Text c="dimmed">Geçmiş kayıtları...</Text>
              </Tabs.Panel>
            </Tabs>

            {/* Footer */}
            <Box p="md" bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">Son güncelleme: {new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
                <Group gap="sm">
                  <UnstyledButton>
                    <Text size="sm" c="red" fw={500}>Devre Dışı Bırak</Text>
                  </UnstyledButton>
                  <UnstyledButton>
                    <Text size="sm" c="blue" fw={500}>Değişiklikleri Kaydet</Text>
                  </UnstyledButton>
                </Group>
              </Group>
            </Box>
          </Paper>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
