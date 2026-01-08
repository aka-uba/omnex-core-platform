'use client';

import { useMemo } from 'react';
import {
  Grid,
  Paper,
  Image,
  Box,
  Text,
  Badge,
  Group,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Button,
  Divider,
  Progress,
} from '@mantine/core';
import {
  IconHome,
  IconBath,
  IconCurrencyEuro,
  IconWifi,
  IconFlame,
  IconBolt,
  IconPrinter,
  IconShare,
  IconCheck,
  IconBalloon,
  IconCar,
  IconElevator,
  IconBike,
} from '@tabler/icons-react';
import { useCurrency } from '@/hooks/useCurrency';

interface ApartmentDesignV1Props {
  apartment: any;
  locale: string;
}

export function ApartmentDesignV1({ apartment, locale }: ApartmentDesignV1Props) {
  const { formatCurrency } = useCurrency();

  const coverImageUrl = useMemo(() => {
    if (apartment.coverImage) {
      return `/api/core-files/${apartment.coverImage}/download?inline=true`;
    }
    if (apartment.images && apartment.images.length > 0) {
      return `/api/core-files/${apartment.images[0]}/download?inline=true`;
    }
    return null;
  }, [apartment]);

  const thumbnails = useMemo(() => {
    if (!apartment.images || apartment.images.length === 0) return [];
    return apartment.images.slice(0, 4);
  }, [apartment.images]);

  const coldRent = Number(apartment.coldRent) || 0;
  const additionalCosts = Number(apartment.additionalCosts) || 0;
  const heatingCosts = Number(apartment.heatingCosts) || 0;
  const totalRent = coldRent + additionalCosts + heatingCosts;
  const deposit = Number(apartment.deposit) || coldRent * 3;

  // Features data
  const unitFeatures = [
    { label: 'Balkon', icon: IconBalloon, available: apartment.hasBalcony },
    { label: 'Küvet', icon: IconBath, available: apartment.hasBathtub },
    { label: 'Ankastre Mutfak', icon: IconHome, available: apartment.hasFittedKitchen },
    { label: 'Yüksek Tavan', icon: IconHome, available: apartment.hasHighCeilings },
  ];

  const buildingFeatures = [
    { label: 'Asansör', icon: IconElevator, available: apartment.hasElevator },
    { label: 'Bodrum Depo', icon: IconHome, available: apartment.hasBasement },
    { label: 'Bisiklet Odası', icon: IconBike, available: apartment.hasBikeRoom },
  ];

  const parkingFeatures = [
    { label: 'Kablolu TV', icon: IconHome, available: apartment.hasCableTV },
    { label: 'Garaj', icon: IconCar, available: apartment.hasGarage },
  ];

  return (
    <Paper shadow="xs" radius="md" withBorder>
      <Grid gutter={0}>
        {/* Sol Panel - Sticky */}
        <Grid.Col span={{ base: 12, lg: 5, xl: 4 }}>
          <Stack gap="md" p="md" style={{ position: 'sticky', top: 0 }}>
            {/* Ana Görsel */}
            <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
              <Box pos="relative" style={{ aspectRatio: '4/3' }}>
                {coverImageUrl ? (
                  <Image
                    src={coverImageUrl}
                    alt={apartment.unitNumber}
                    h="100%"
                    fit="cover"
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
                <Badge
                  pos="absolute"
                  top={12}
                  right={12}
                  variant="filled"
                  color="dark"
                  radius="sm"
                >
                  {apartment.isFurnished ? 'Mobilyalı' : 'Mobilyasız'}
                </Badge>
              </Box>
              {/* Küçük Resimler */}
              {thumbnails.length > 0 && (
                <SimpleGrid cols={4} spacing={4} p={4} bg="gray.1">
                  {thumbnails.map((imageId: string, index: number) => (
                    <Box key={index} style={{ aspectRatio: '1', borderRadius: 4, overflow: 'hidden' }}>
                      <Image
                        src={`/api/core-files/${imageId}/download?inline=true`}
                        alt={`Görsel ${index + 1}`}
                        h="100%"
                        fit="cover"
                      />
                    </Box>
                  ))}
                  {thumbnails.length >= 4 && apartment.images?.length > 4 && (
                    <Box
                      style={{
                        aspectRatio: '1',
                        borderRadius: 4,
                        background: 'var(--mantine-color-gray-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size="sm" fw={500} c="dimmed">+{apartment.images.length - 4}</Text>
                    </Box>
                  )}
                </SimpleGrid>
              )}
            </Paper>

            {/* Öne Çıkanlar */}
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="sm">Öne Çıkanlar</Text>
              <SimpleGrid cols={2} spacing="sm">
                <Paper p="sm" radius="sm" bg="blue.0" withBorder style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                  <Text size="xs" c="blue.6">Toplam Alan</Text>
                  <Text size="xl" fw={700}>{apartment.area || '-'} m²</Text>
                </Paper>
                <Paper p="sm" radius="sm" bg="green.0" withBorder style={{ borderColor: 'var(--mantine-color-green-2)' }}>
                  <Text size="xs" c="green.6">Oda Sayısı</Text>
                  <Text size="xl" fw={700}>{apartment.roomCount || '-'}</Text>
                </Paper>
                <Paper p="sm" radius="sm" bg="grape.0" withBorder style={{ borderColor: 'var(--mantine-color-grape-2)' }}>
                  <Text size="xs" c="grape.6">Net Kira</Text>
                  <Text size="xl" fw={700}>{formatCurrency(coldRent)}</Text>
                </Paper>
                <Paper p="sm" radius="sm" bg="orange.0" withBorder style={{ borderColor: 'var(--mantine-color-orange-2)' }}>
                  <Text size="xs" c="orange.6">Durum</Text>
                  <Text size="xl" fw={700}>
                    {apartment.status === 'rented' ? 'Dolu' :
                     apartment.status === 'empty' ? 'Boş' :
                     apartment.status === 'sold' ? 'Satıldı' : 'Bakımda'}
                  </Text>
                </Paper>
              </SimpleGrid>
              <Divider my="md" />
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Son Yenileme</Text>
                  <Text size="sm" fw={500}>{apartment.lastRenovationDate ? new Date(apartment.lastRenovationDate).getFullYear() : '-'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Enerji Sınıfı</Text>
                  <Badge color="green" variant="light" size="sm">B</Badge>
                </Group>
              </Stack>
            </Paper>

            {/* Hızlı Eylemler */}
            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Button variant="default" leftSection={<IconPrinter size={18} />} fullWidth>
                  Bilgi Kartı Yazdır
                </Button>
                <Button variant="default" leftSection={<IconShare size={18} />} fullWidth>
                  Bağlantı Paylaş
                </Button>
              </Stack>
            </Paper>

            {/* Açıklama - Sol tarafa eklendi */}
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="md">
                <ThemeIcon variant="light" color="blue" size="sm">
                  <IconHome size={14} />
                </ThemeIcon>
                <Text fw={600}>Açıklama</Text>
              </Group>
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                {apartment.description || 'Açıklama girilmemiş.'}
              </Text>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Sağ Panel - İçerik */}
        <Grid.Col span={{ base: 12, lg: 7, xl: 8 }}>
          <Stack gap="lg" p="md">
            {/* Ana Veriler */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="md" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                <Group gap="xs">
                  <ThemeIcon variant="light" color="blue" size="sm">
                    <IconHome size={14} />
                  </ThemeIcon>
                  <Text fw={600}>Ana Veriler</Text>
                </Group>
                <Text size="xs" c="dimmed">Güncel: {new Date().toLocaleDateString('tr-TR')}</Text>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Daire Tipi</Text>
                  <Text size="sm" fw={500}>{apartment.apartmentType || '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Kat</Text>
                  <Text size="sm" fw={500}>{apartment.floor || '-'}. Kat</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Yaşam Alanı</Text>
                  <Text size="sm" fw={500}>{apartment.area || '-'} m²</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Toplam Oda</Text>
                  <Text size="sm" fw={500}>{apartment.roomCount || '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Yatak Odası</Text>
                  <Text size="sm" fw={500}>{apartment.bedroomCount || '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Banyo</Text>
                  <Text size="sm" fw={500}>{apartment.bathroomCount || '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>İnşa Yılı</Text>
                  <Text size="sm" fw={500}>{apartment.constructionYear || '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Son Yenileme</Text>
                  <Text size="sm" fw={500}>{apartment.lastRenovationDate ? new Date(apartment.lastRenovationDate).getFullYear() : '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>İnternet Hızı</Text>
                  <Group gap="xs">
                    <IconWifi size={16} color="green" />
                    <Text size="sm" fw={500}>{apartment.internetSpeed || '-'}</Text>
                  </Group>
                </Box>
              </SimpleGrid>
            </Paper>

            {/* Finansal ve Maliyetler */}
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="md" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                <ThemeIcon variant="light" color="blue" size="sm">
                  <IconCurrencyEuro size={14} />
                </ThemeIcon>
                <Text fw={600}>Finansal & Maliyetler</Text>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
                <Paper p="sm" bg="gray.0" radius="sm" withBorder>
                  <Text size="xs" c="dimmed">Net Kira (Kalt)</Text>
                  <Text size="lg" fw={700}>{formatCurrency(coldRent)}</Text>
                </Paper>
                <Paper p="sm" bg="gray.0" radius="sm" withBorder>
                  <Text size="xs" c="dimmed">Yan Giderler</Text>
                  <Text size="lg" fw={700}>{formatCurrency(additionalCosts)}</Text>
                </Paper>
                <Paper p="sm" bg="gray.0" radius="sm" withBorder>
                  <Text size="xs" c="dimmed">Isıtma Giderleri</Text>
                  <Text size="lg" fw={700}>{formatCurrency(heatingCosts)}</Text>
                </Paper>
                <Paper p="sm" bg="blue.0" radius="sm" withBorder style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
                  <Text size="xs" c="blue" fw={500}>Toplam Sıcak Kira</Text>
                  <Text size="xl" fw={800} c="blue">{formatCurrency(totalRent)}</Text>
                </Paper>
              </SimpleGrid>
              <Divider my="md" />
              <SimpleGrid cols={2}>
                <Box>
                  <Text size="sm" fw={600} mb="xs">Depozito (Kaution)</Text>
                  <Group gap="sm">
                    <Paper p="xs" px="md" bg="gray.0" radius="sm" withBorder>
                      <Text size="sm" fw={500}>{formatCurrency(deposit)}</Text>
                    </Paper>
                    <Text size="xs" c="dimmed">(3x Net Kira)</Text>
                  </Group>
                </Box>
                <Box>
                  <Text size="sm" fw={600} mb="xs">Notlar</Text>
                  <Text size="sm" c="dimmed">
                    Isıtma maliyetleri önceki kiracının tüketimine göre tahmin edilmiştir. Su, yan giderlere dahildir.
                  </Text>
                </Box>
              </SimpleGrid>
            </Paper>

            {/* Özellikler ve Olanaklar */}
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="md" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                <ThemeIcon variant="light" color="blue" size="sm">
                  <IconCheck size={14} />
                </ThemeIcon>
                <Text fw={600}>Özellikler & Olanaklar</Text>
              </Group>

              <Stack gap="md">
                <Box>
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">Daire Özellikleri</Text>
                  <Group gap="xs">
                    {unitFeatures.map((feature, index) => (
                      <Badge
                        key={index}
                        variant={feature.available ? 'light' : 'outline'}
                        color={feature.available ? 'green' : 'gray'}
                        leftSection={<feature.icon size={12} />}
                        style={!feature.available ? { opacity: 0.5, textDecoration: 'line-through' } : {}}
                      >
                        {feature.label}
                      </Badge>
                    ))}
                  </Group>
                </Box>

                <Box>
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">Bina & Erişim</Text>
                  <Group gap="xs">
                    {buildingFeatures.map((feature, index) => (
                      <Badge
                        key={index}
                        variant={feature.available ? 'light' : 'outline'}
                        color={feature.available ? 'green' : 'gray'}
                        leftSection={<feature.icon size={12} />}
                        style={!feature.available ? { opacity: 0.5, textDecoration: 'line-through' } : {}}
                      >
                        {feature.label}
                      </Badge>
                    ))}
                  </Group>
                </Box>

                <Box>
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">Teknoloji & Otopark</Text>
                  <Group gap="xs">
                    {parkingFeatures.map((feature, index) => (
                      <Badge
                        key={index}
                        variant={feature.available ? 'light' : 'outline'}
                        color={feature.available ? 'green' : 'gray'}
                        leftSection={<feature.icon size={12} />}
                        style={!feature.available ? { opacity: 0.5, textDecoration: 'line-through' } : {}}
                      >
                        {feature.label}
                      </Badge>
                    ))}
                  </Group>
                </Box>
              </Stack>
            </Paper>

            {/* Enerji ve Isıtma - Yan Yana */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {/* Enerji */}
              <Paper p="md" radius="md" withBorder>
                <Group gap="xs" mb="md" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                  <ThemeIcon variant="light" color="blue" size="sm">
                    <IconBolt size={14} />
                  </ThemeIcon>
                  <Text fw={600}>Enerji</Text>
                </Group>
                <Group gap="md" mb="md">
                  <ThemeIcon size={64} radius="xl" variant="light" color="green">
                    <Text size="xl" fw={700}>B</Text>
                  </ThemeIcon>
                  <Box>
                    <Text size="sm" c="dimmed">Verimlilik Sınıfı</Text>
                    <Text size="md" fw={600}>İyi Verimlilik</Text>
                  </Box>
                </Group>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Tüketim</Text>
                    <Text size="sm" fw={500}>72 kWh/(m²*a)</Text>
                  </Group>
                  <Progress value={35} size="sm" color="green" />
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">A+</Text>
                    <Text size="xs" c="dimmed">H</Text>
                  </Group>
                  <Divider my="xs" />
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Sertifika Tipi</Text>
                    <Text size="sm" fw={500}>Tüketim (Verbrauch)</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Geçerlilik</Text>
                    <Text size="sm" fw={500}>24.10.2028</Text>
                  </Group>
                </Stack>
              </Paper>

              {/* Isıtma */}
              <Paper p="md" radius="md" withBorder>
                <Group gap="xs" mb="md" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                  <ThemeIcon variant="light" color="blue" size="sm">
                    <IconFlame size={14} />
                  </ThemeIcon>
                  <Text fw={600}>Isıtma</Text>
                </Group>
                <Stack gap="md">
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Birincil Sistem</Text>
                    <Paper p="xs" bg="gray.0" radius="sm" withBorder>
                      <Group gap="xs">
                        <IconFlame size={18} color="orange" />
                        <Text size="sm" fw={500}>{apartment.heatingType || 'Merkezi Gaz Isıtma'}</Text>
                      </Group>
                    </Paper>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>İkincil Sistem</Text>
                    <Paper p="xs" bg="gray.0" radius="sm" withBorder style={{ borderStyle: 'dashed' }}>
                      <Text size="sm" c="dimmed">Mevcut değil</Text>
                    </Paper>
                  </Box>
                  <Box>
                    <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs">Isıtma Özellikleri</Text>
                    <Group gap="xs">
                      <Badge variant="light" color="gray">Yerden Isıtma</Badge>
                      <Badge variant="light" color="gray">Dijital Termostat</Badge>
                    </Group>
                  </Box>
                </Stack>
              </Paper>
            </SimpleGrid>
          </Stack>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
