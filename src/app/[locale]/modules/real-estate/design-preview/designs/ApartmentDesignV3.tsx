'use client';

import { useMemo } from 'react';
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
  Divider,
  UnstyledButton,
} from '@mantine/core';
import {
  IconHome,
  IconBath,
  IconCurrencyEuro,
  IconFlame,
  IconCheck,
  IconInfoCircle,
  IconQrcode,
  IconTool,
  IconChevronRight,
  IconCar,
  IconToolsKitchen2,
  IconDroplet,
  IconBalloon,
  IconBuildingWarehouse,
  IconWindow,
  IconSun,
} from '@tabler/icons-react';
import { useCurrency } from '@/hooks/useCurrency';

interface ApartmentDesignV3Props {
  apartment: any;
  locale: string;
}

interface TimelineItemProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  isLast?: boolean;
}

function TimelineItem({ icon, iconColor, iconBg, title, subtitle, children, isLast }: TimelineItemProps) {
  return (
    <Box pos="relative" pl={48} pb={isLast ? 0 : 48}>
      {/* Timeline Line */}
      {!isLast && (
        <Box
          pos="absolute"
          left={20}
          top={40}
          bottom={0}
          w={2}
          bg="gray.2"
          style={{ borderRadius: 1 }}
        />
      )}
      {/* Timeline Icon */}
      <ThemeIcon
        pos="absolute"
        left={0}
        top={0}
        size={40}
        radius="xl"
        variant="light"
        color={iconColor}
        style={{
          backgroundColor: iconBg,
          border: `2px solid var(--mantine-color-${iconColor}-5)`,
          zIndex: 1,
        }}
      >
        {icon}
      </ThemeIcon>
      {/* Content */}
      <Paper p="lg" radius="md" withBorder shadow="xs">
        <Group justify="space-between" mb="md">
          <Title order={4}>{title}</Title>
          <Badge variant="light" color="gray" size="sm">{subtitle}</Badge>
        </Group>
        {children}
      </Paper>
    </Box>
  );
}

export function ApartmentDesignV3({ apartment, locale }: ApartmentDesignV3Props) {
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

  const coldRent = Number(apartment.coldRent) || 0;
  const additionalCosts = Number(apartment.additionalCosts) || 0;
  const heatingCosts = Number(apartment.heatingCosts) || 0;
  const totalRent = coldRent + additionalCosts + heatingCosts;
  const deposit = Number(apartment.deposit) || coldRent * 3;

  // Feature badges
  const activeFeatures = [
    { label: 'Stellplatz', icon: IconCar, color: 'indigo', available: apartment.hasParkingSpot },
    { label: 'Zentralheizung', icon: IconFlame, color: 'teal', available: true },
    { label: 'Einbauküche', icon: IconToolsKitchen2, color: 'yellow', available: apartment.hasFittedKitchen },
    { label: 'Dusche', icon: IconDroplet, color: 'cyan', available: apartment.hasShower },
    { label: 'Badewanne', icon: IconBath, color: 'cyan', available: apartment.hasBathtub },
    { label: 'Balkon', icon: IconBalloon, color: 'pink', available: apartment.hasBalcony },
    { label: 'Kellerraum', icon: IconBuildingWarehouse, color: 'gray', available: apartment.hasBasement },
    { label: 'Schallschutzfenster', icon: IconWindow, color: 'gray', available: apartment.hasSoundproofWindows },
    { label: 'Tageslichtbad', icon: IconSun, color: 'orange', available: apartment.hasDaylightBathroom },
  ];

  const inactiveFeatures = [
    'Garage',
    'Aufzug',
    'Garten',
    'Fußbodenheizung',
    'Kamin / Ofen',
    'Klimaanlage',
  ];

  return (
    <Paper shadow="xs" radius="md" withBorder>
      <Grid gutter={0}>
        {/* Sol Panel */}
        <Grid.Col span={{ base: 12, lg: 5, xl: 4 }}>
          <Stack gap="md" p="md">
            {/* Ana Görsel */}
            <Paper radius="lg" withBorder style={{ overflow: 'hidden' }}>
              <Box pos="relative" h={320}>
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
                {/* Gradient Overlay */}
                <Box
                  pos="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  p="lg"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  }}
                >
                  <Group gap="xs" mb="xs">
                    <Badge color="green" variant="filled" size="sm" tt="uppercase">Aktif</Badge>
                    <Badge color="blue" variant="filled" size="sm" tt="uppercase">Dolu</Badge>
                  </Group>
                  <Title order={2} c="white">{apartment.apartmentType || 'Dachgeschoss'}</Title>
                  <Text size="sm" c="gray.3">{apartment.property?.address || 'Hauptstr. 116'}</Text>
                </Box>
              </Box>

              {/* İstatistik Grid */}
              <SimpleGrid cols={2} spacing={0}>
                <Box p="md" ta="center" style={{ borderRight: '1px solid var(--mantine-color-gray-3)', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Alan</Text>
                  <Text size="xl" fw={700} mt={4}>{apartment.area || '-'} m²</Text>
                </Box>
                <Box p="md" ta="center" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Oda Sayısı</Text>
                  <Text size="xl" fw={700} mt={4}>{apartment.roomCount || '-'}</Text>
                </Box>
                <Box p="md" ta="center" style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Kat</Text>
                  <Text size="xl" fw={700} mt={4}>{apartment.floor || '-'}</Text>
                </Box>
                <Box p="md" ta="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Isıtma</Text>
                  <Text size="xl" fw={700} mt={4}>Zentral</Text>
                </Box>
              </SimpleGrid>
            </Paper>

            {/* Hızlı İşlemler */}
            <Paper p="lg" radius="lg" withBorder>
              <Title order={4} mb="md">Hızlı İşlemler</Title>
              <Stack gap="sm">
                <UnstyledButton
                  w="100%"
                  p="sm"
                  style={{
                    borderRadius: 'var(--mantine-radius-md)',
                    border: '1px solid var(--mantine-color-gray-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" radius="md">
                      <IconQrcode size={18} />
                    </ThemeIcon>
                    <Box>
                      <Text size="sm" fw={500}>Daire QR Kodu</Text>
                      <Text size="xs" c="dimmed">Paylaşmak için oluştur</Text>
                    </Box>
                  </Group>
                  <IconChevronRight size={18} color="gray" />
                </UnstyledButton>

                <UnstyledButton
                  w="100%"
                  p="sm"
                  style={{
                    borderRadius: 'var(--mantine-radius-md)',
                    border: '1px solid var(--mantine-color-gray-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Group gap="sm">
                    <ThemeIcon variant="light" color="grape" radius="md">
                      <IconTool size={18} />
                    </ThemeIcon>
                    <Box>
                      <Text size="sm" fw={500}>Bakım Talebi</Text>
                      <Text size="xs" c="dimmed">Yeni talep oluştur</Text>
                    </Box>
                  </Group>
                  <IconChevronRight size={18} color="gray" />
                </UnstyledButton>
              </Stack>
            </Paper>

            {/* Konum Bilgisi - Sol tarafa eklendi */}
            <Paper p="lg" radius="lg" withBorder>
              <Title order={4} mb="md">Konum</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Adres</Text>
                  <Text size="sm" fw={500}>{apartment.property?.address || 'Hauptstr. 116'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Şehir</Text>
                  <Text size="sm" fw={500}>{apartment.property?.city || 'Mönchengladbach'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Posta Kodu</Text>
                  <Text size="sm" fw={500}>{apartment.property?.postalCode || '41236'}</Text>
                </Group>
              </Stack>
            </Paper>

            {/* Depozito Bilgisi */}
            <Paper p="lg" radius="lg" withBorder bg="blue.0">
              <Group gap="xs" mb="sm">
                <IconInfoCircle size={18} color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500} c="blue.8">Depozito Bilgisi</Text>
              </Group>
              <Text size="sm" c="blue.7">
                Depozito: 3 aylık kira bedeli ({formatCurrency(deposit)}). Isıtma giderleri yan giderlere dahildir.
              </Text>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Sağ Panel - Timeline */}
        <Grid.Col span={{ base: 12, lg: 7, xl: 8 }}>
          <Box p="md" pl={8}>
            {/* Ana Veriler */}
            <TimelineItem
              icon={<IconInfoCircle size={20} />}
              iconColor="blue"
              iconBg="var(--mantine-color-blue-0)"
              title="Ana Veriler"
              subtitle="Temel Bilgiler"
            >
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Daire Numarası</Text>
                  <Text size="md">{apartment.unitNumber || 'DG rechts'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Daire Tipi</Text>
                  <Text size="md">{apartment.apartmentType || 'Çatı Katı (Dachgeschoss)'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Yatak Odası</Text>
                  <Text size="md">{apartment.bedroomCount || '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Banyo</Text>
                  <Text size="md">{apartment.bathroomCount || '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Son Yenileme</Text>
                  <Text size="md">{apartment.lastRenovationDate ? new Date(apartment.lastRenovationDate).getFullYear() : '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>İnternet Hızı</Text>
                  <Text size="md">{apartment.internetSpeed || 'Fiber (1000 Mbps)'}</Text>
                </Box>
              </SimpleGrid>
            </TimelineItem>

            {/* Donanım & Özellikler */}
            <TimelineItem
              icon={<IconCheck size={20} />}
              iconColor="green"
              iconBg="var(--mantine-color-green-0)"
              title="Donanım & Özellikler"
              subtitle="Daire Özellikleri"
            >
              <Group gap="xs" mb="md">
                {activeFeatures.filter(f => f.available !== false).map((feature, index) => (
                  <Badge
                    key={index}
                    variant="light"
                    color={feature.color}
                    leftSection={<feature.icon size={12} />}
                    size="md"
                    style={{ borderWidth: 1, borderStyle: 'solid' }}
                  >
                    {feature.label}
                  </Badge>
                ))}
              </Group>
              <Divider my="md" />
              <Text size="sm" fw={500} c="dimmed" mb="sm">Diğer Olanaklar</Text>
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                {inactiveFeatures.map((feature, index) => (
                  <Group key={index} gap="xs" style={{ opacity: 0.5 }}>
                    <Box w={6} h={6} bg="gray.4" style={{ borderRadius: '50%' }} />
                    <Text size="sm" c="dimmed">{feature}</Text>
                  </Group>
                ))}
              </SimpleGrid>
            </TimelineItem>

            {/* Isıtma & Enerji */}
            <TimelineItem
              icon={<IconFlame size={20} />}
              iconColor="orange"
              iconBg="var(--mantine-color-orange-0)"
              title="Isıtma & Enerji Verimliliği"
              subtitle="Teknik Detaylar"
            >
              <Stack gap="md">
                <Paper p="md" bg="gray.0" radius="md">
                  <Text size="sm" fw={600} mb="sm">Isıtma Sistemleri</Text>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <Box>
                      <Text size="xs" c="dimmed" mb={4}>Birincil Sistem</Text>
                      <Text size="sm" fw={500}>{apartment.heatingType || 'Zentralheizung (Gas)'}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed" mb={4}>Yedek Sistem</Text>
                      <Text size="sm" c="dimmed" fs="italic">Mevcut değil</Text>
                    </Box>
                  </SimpleGrid>
                </Paper>

                <Box>
                  <Text size="sm" fw={600} mb="sm">Enerji Kimlik Belgesi</Text>
                  <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
                    <Paper p="sm" radius="sm" withBorder>
                      <Text size="xs" c="dimmed" mb={4}>Verbrauchsart</Text>
                      <Text size="sm" fw={500}>Verbrauchsausweis</Text>
                    </Paper>
                    <Paper p="sm" radius="sm" withBorder>
                      <Text size="xs" c="dimmed" mb={4}>Enerji Tüketimi</Text>
                      <Text size="sm" fw={500}>124 kWh/(m²*a)</Text>
                    </Paper>
                    <Paper p="sm" radius="sm" withBorder>
                      <Text size="xs" c="dimmed" mb={4}>Yapım Yılı</Text>
                      <Text size="sm" fw={500}>{apartment.constructionYear || '1985'}</Text>
                    </Paper>
                  </SimpleGrid>
                </Box>
              </Stack>
            </TimelineItem>

            {/* Aylık Maliyetler */}
            <TimelineItem
              icon={<IconCurrencyEuro size={20} />}
              iconColor="grape"
              iconBg="var(--mantine-color-grape-0)"
              title="Aylık Maliyetler"
              subtitle="Finansal"
              isLast
            >
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm" mb="md">
                <Paper p="md" bg="gray.0" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Net Kira (Kalt)</Text>
                  <Text size="lg" fw={700}>{formatCurrency(coldRent)}</Text>
                </Paper>
                <Paper p="md" bg="gray.0" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Yan Giderler</Text>
                  <Text size="lg" fw={700}>{formatCurrency(additionalCosts)}</Text>
                </Paper>
                <Paper p="md" bg="gray.0" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Isıtma</Text>
                  <Text size="lg" fw={700}>{formatCurrency(heatingCosts)}</Text>
                </Paper>
                <Paper p="md" bg="blue.0" radius="md" style={{ border: '1px solid var(--mantine-color-blue-2)' }}>
                  <Text size="xs" c="blue" tt="uppercase" fw={600} mb={4}>Toplam</Text>
                  <Text size="lg" fw={700} c="blue">{formatCurrency(totalRent)}</Text>
                </Paper>
              </SimpleGrid>
              <Group gap="xs">
                <IconInfoCircle size={16} color="gray" />
                <Text size="sm" c="dimmed">
                  Depozito: 3 aylık kira bedeli ({formatCurrency(deposit)}). Isıtma giderleri yan giderlere dahildir.
                </Text>
              </Group>
            </TimelineItem>
          </Box>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
