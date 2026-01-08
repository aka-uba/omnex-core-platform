'use client';

import { useMemo } from 'react';
import {
  Container,
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Grid,
  SimpleGrid,
  Image,
  Box,
  Title,
  ThemeIcon,
  Divider,
  Loader,
  Center,
  Alert,
} from '@mantine/core';
import {
  IconHome,
  IconCurrencyEuro,
  IconFlame,
  IconCheck,
  IconInfoCircle,
  IconBalloon,
  IconBuildingWarehouse,
  IconMapPin,
  IconPhone,
  IconMail,
  IconWorld,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

interface PublicApartmentViewClientProps {
  apartmentId: string;
  locale: string;
  tenantSlug: string;
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

// Format currency without hook (for public page)
function formatCurrency(amount: number, locale: string = 'tr'): string {
  const localeMap: Record<string, { locale: string; currency: string }> = {
    tr: { locale: 'tr-TR', currency: 'TRY' },
    en: { locale: 'en-US', currency: 'USD' },
    de: { locale: 'de-DE', currency: 'EUR' },
    ar: { locale: 'ar-SA', currency: 'SAR' },
  };
  const { locale: localeStr, currency } = localeMap[locale] || localeMap.tr;
  return new Intl.NumberFormat(localeStr, { style: 'currency', currency }).format(amount);
}

export function PublicApartmentViewClient({ apartmentId, locale, tenantSlug }: PublicApartmentViewClientProps) {
  // Fetch apartment data from public API
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-apartment', apartmentId, tenantSlug],
    queryFn: async () => {
      const response = await fetch(`/api/public/apartments/${apartmentId}?tenant=${tenantSlug}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch apartment');
      }
      return response.json();
    },
    enabled: !!apartmentId && !!tenantSlug,
  });

  const apartment = data?.data?.apartment;
  const company = data?.data?.company;

  const coverImageUrl = useMemo(() => {
    if (!apartment) return null;
    if (apartment.coverImage) {
      return `/api/core-files/${apartment.coverImage}/download?inline=true`;
    }
    if (apartment.images && apartment.images.length > 0) {
      return `/api/core-files/${apartment.images[0]}/download?inline=true`;
    }
    return null;
  }, [apartment]);

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Yükleniyor...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error || !apartment) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertCircle size={24} />}
          title="Daire Bulunamadı"
          color="red"
          variant="filled"
        >
          {error instanceof Error ? error.message : 'Bu daire mevcut değil veya artık yayında değil.'}
        </Alert>
      </Container>
    );
  }

  const coldRent = Number(apartment.coldRent) || 0;
  const additionalCosts = Number(apartment.additionalCosts) || 0;
  const heatingCosts = Number(apartment.heatingCosts) || 0;
  const totalRent = coldRent + additionalCosts + heatingCosts;
  const deposit = Number(apartment.deposit) || coldRent * 3;

  // Parse heating systems from JSON
  const heatingSystems = apartment.heatingSystems as Array<{ type: string; isPrimary?: boolean }> | null;
  const primaryHeating = heatingSystems?.find(h => h.isPrimary)?.type || heatingSystems?.[0]?.type || 'Merkezi Isıtma';

  // Feature badges based on actual schema fields
  const activeFeatures = [
    { label: 'Balkon', icon: IconBalloon, color: 'pink', available: apartment.balcony },
    { label: 'Salon', icon: IconHome, color: 'blue', available: apartment.livingRoom },
    { label: 'Bodrum', icon: IconBuildingWarehouse, color: 'gray', available: apartment.basementSize && Number(apartment.basementSize) > 0 },
  ].filter(f => f.available);

  return (
    <Container size="xl" py="xl">
      {/* Company Header */}
      {company && (
        <Paper shadow="xs" p="md" mb="lg" radius="md" withBorder>
          <Group justify="space-between" wrap="wrap">
            <Group gap="md">
              {company.logo && (
                <Image
                  src={company.logo.startsWith('/uploads') ? company.logo : `/api/core-files/${company.logo}/download?inline=true`}
                  alt={company.name}
                  h={40}
                  w="auto"
                  fit="contain"
                />
              )}
              <Title order={3}>{company.name}</Title>
            </Group>
            <Group gap="lg" wrap="wrap">
              {company.phone && (
                <Group gap="xs">
                  <IconPhone size={16} />
                  <Text size="sm">{company.phone}</Text>
                </Group>
              )}
              {company.email && (
                <Group gap="xs">
                  <IconMail size={16} />
                  <Text size="sm">{company.email}</Text>
                </Group>
              )}
              {company.website && (
                <Group gap="xs">
                  <IconWorld size={16} />
                  <Text size="sm">{company.website}</Text>
                </Group>
              )}
            </Group>
          </Group>
        </Paper>
      )}

      {/* Main Content - V3 Design */}
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
                      {apartment.status === 'rented' && (
                        <Badge color="blue" variant="filled" size="sm" tt="uppercase">Kiralık</Badge>
                      )}
                      {apartment.status === 'empty' && (
                        <Badge color="yellow" variant="filled" size="sm" tt="uppercase">Boş</Badge>
                      )}
                    </Group>
                    <Title order={2} c="white">{apartment.apartmentType || apartment.unitNumber}</Title>
                    <Text size="sm" c="gray.3">{apartment.property?.address || ''}</Text>
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
                    <Text size="xl" fw={700} mt={4}>{apartment.heatingType || 'Merkezi'}</Text>
                  </Box>
                </SimpleGrid>
              </Paper>

              {/* Konum Bilgisi */}
              <Paper p="lg" radius="lg" withBorder>
                <Group gap="xs" mb="md">
                  <IconMapPin size={20} />
                  <Title order={4}>Konum</Title>
                </Group>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Adres</Text>
                    <Text size="sm" fw={500}>{apartment.property?.address || '-'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Şehir</Text>
                    <Text size="sm" fw={500}>{apartment.property?.city || '-'}</Text>
                  </Group>
                  {apartment.property?.postalCode && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Posta Kodu</Text>
                      <Text size="sm" fw={500}>{apartment.property.postalCode}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>

              {/* Depozito Bilgisi */}
              <Paper p="lg" radius="lg" withBorder bg="blue.0">
                <Group gap="xs" mb="sm">
                  <IconInfoCircle size={18} color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500} c="blue.8">Depozito Bilgisi</Text>
                </Group>
                <Text size="sm" c="blue.7">
                  Depozito: 3 aylık kira bedeli ({formatCurrency(deposit, locale)}). Isıtma giderleri yan giderlere dahildir.
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
                    <Text size="md">{apartment.unitNumber}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>Daire Tipi</Text>
                    <Text size="md">{apartment.apartmentType || '-'}</Text>
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
                    <Text size="md">{apartment.internetSpeed || '-'}</Text>
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
                {activeFeatures.length > 0 ? (
                  <Group gap="xs" mb="md">
                    {activeFeatures.map((feature, index) => (
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
                ) : (
                  <Text size="sm" c="dimmed">Özellik bilgisi bulunmamaktadır.</Text>
                )}
                {apartment.basementSize && Number(apartment.basementSize) > 0 && (
                  <>
                    <Divider my="md" />
                    <Text size="sm">Bodrum Alanı: <strong>{Number(apartment.basementSize)} m²</strong></Text>
                  </>
                )}
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
                        <Text size="sm" fw={500}>{primaryHeating}</Text>
                      </Box>
                      {heatingSystems && heatingSystems.length > 1 && (
                        <Box>
                          <Text size="xs" c="dimmed" mb={4}>Yedek Sistem</Text>
                          <Text size="sm" fw={500}>{heatingSystems[1]?.type || '-'}</Text>
                        </Box>
                      )}
                    </SimpleGrid>
                  </Paper>

                  <Box>
                    <Text size="sm" fw={600} mb="sm">Enerji Kimlik Belgesi</Text>
                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
                      <Paper p="sm" radius="sm" withBorder>
                        <Text size="xs" c="dimmed" mb={4}>Belge Tipi</Text>
                        <Text size="sm" fw={500}>{apartment.energyCertificateType || '-'}</Text>
                      </Paper>
                      <Paper p="sm" radius="sm" withBorder>
                        <Text size="xs" c="dimmed" mb={4}>Enerji Tüketimi</Text>
                        <Text size="sm" fw={500}>{apartment.energyConsumption ? `${Number(apartment.energyConsumption)} kWh/(m²*a)` : '-'}</Text>
                      </Paper>
                      <Paper p="sm" radius="sm" withBorder>
                        <Text size="xs" c="dimmed" mb={4}>Yapım Yılı</Text>
                        <Text size="sm" fw={500}>{apartment.property?.constructionYear || apartment.energyCertificateYear || '-'}</Text>
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
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Net Kira</Text>
                    <Text size="lg" fw={700}>{formatCurrency(coldRent, locale)}</Text>
                  </Paper>
                  <Paper p="md" bg="gray.0" radius="md">
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Yan Giderler</Text>
                    <Text size="lg" fw={700}>{formatCurrency(additionalCosts, locale)}</Text>
                  </Paper>
                  <Paper p="md" bg="gray.0" radius="md">
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>Isıtma</Text>
                    <Text size="lg" fw={700}>{formatCurrency(heatingCosts, locale)}</Text>
                  </Paper>
                  <Paper p="md" bg="blue.0" radius="md" style={{ border: '1px solid var(--mantine-color-blue-2)' }}>
                    <Text size="xs" c="blue" tt="uppercase" fw={600} mb={4}>Toplam</Text>
                    <Text size="lg" fw={700} c="blue">{formatCurrency(totalRent, locale)}</Text>
                  </Paper>
                </SimpleGrid>
                <Group gap="xs">
                  <IconInfoCircle size={16} color="gray" />
                  <Text size="sm" c="dimmed">
                    Depozito: 3 aylık kira bedeli ({formatCurrency(deposit, locale)}). Isıtma giderleri yan giderlere dahildir.
                  </Text>
                </Group>
              </TimelineItem>
            </Box>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Footer */}
      <Paper shadow="xs" p="md" mt="lg" radius="md" withBorder>
        <Group justify="center">
          <Text size="sm" c="dimmed">
            Bu sayfayı görüntülemek için QR kodu taradınız. Daha fazla bilgi için lütfen emlak danışmanınıza başvurun.
          </Text>
        </Group>
      </Paper>
    </Container>
  );
}
