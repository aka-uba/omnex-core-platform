'use client';

import { useMemo, useEffect, useState } from 'react';
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

// Static translations for public page (no auth required)
const translations: Record<string, Record<string, string>> = {
  tr: {
    loading: 'Yükleniyor...',
    notFound: 'Daire Bulunamadı',
    notFoundMessage: 'Bu daire mevcut değil veya artık yayında değil.',
    mainData: 'Ana Veriler',
    basicInfo: 'Temel Bilgiler',
    unitNumber: 'Daire Numarası',
    apartmentType: 'Daire Tipi',
    bedrooms: 'Yatak Odası',
    bathrooms: 'Banyo',
    lastRenovation: 'Son Yenileme',
    internetSpeed: 'İnternet Hızı',
    equipmentFeatures: 'Donanım & Özellikler',
    apartmentFeatures: 'Daire Özellikleri',
    noFeatures: 'Özellik bilgisi bulunmamaktadır.',
    basementArea: 'Bodrum Alanı',
    heatingEnergy: 'Isıtma & Enerji Verimliliği',
    technicalDetails: 'Teknik Detaylar',
    heatingSystems: 'Isıtma Sistemleri',
    primarySystem: 'Birincil Sistem',
    backupSystem: 'Yedek Sistem',
    energyCertificate: 'Enerji Kimlik Belgesi',
    certificateType: 'Belge Tipi',
    energyConsumption: 'Enerji Tüketimi',
    constructionYear: 'Yapım Yılı',
    monthlyCosts: 'Aylık Maliyetler',
    financial: 'Finansal',
    coldRent: 'Net Kira',
    additionalCosts: 'Yan Giderler',
    heating: 'Isıtma',
    total: 'Toplam',
    depositInfo: 'Depozito Bilgisi',
    depositNote: 'Depozito: 3 aylık kira bedeli ({amount}). Isıtma giderleri yan giderlere dahildir.',
    location: 'Konum',
    address: 'Adres',
    city: 'Şehir',
    postalCode: 'Posta Kodu',
    area: 'Alan',
    roomCount: 'Oda Sayısı',
    floor: 'Kat',
    heatingType: 'Isıtma',
    centralHeating: 'Merkezi',
    active: 'Aktif',
    rented: 'Kiralık',
    empty: 'Boş',
    balcony: 'Balkon',
    livingRoom: 'Salon',
    basement: 'Bodrum',
    footer: 'Bu sayfayı görüntülemek için QR kodu taradınız. Daha fazla bilgi için lütfen emlak danışmanınıza başvurun.',
  },
  en: {
    loading: 'Loading...',
    notFound: 'Apartment Not Found',
    notFoundMessage: 'This apartment does not exist or is no longer published.',
    mainData: 'Main Data',
    basicInfo: 'Basic Information',
    unitNumber: 'Unit Number',
    apartmentType: 'Apartment Type',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    lastRenovation: 'Last Renovation',
    internetSpeed: 'Internet Speed',
    equipmentFeatures: 'Equipment & Features',
    apartmentFeatures: 'Apartment Features',
    noFeatures: 'No feature information available.',
    basementArea: 'Basement Area',
    heatingEnergy: 'Heating & Energy Efficiency',
    technicalDetails: 'Technical Details',
    heatingSystems: 'Heating Systems',
    primarySystem: 'Primary System',
    backupSystem: 'Backup System',
    energyCertificate: 'Energy Certificate',
    certificateType: 'Certificate Type',
    energyConsumption: 'Energy Consumption',
    constructionYear: 'Construction Year',
    monthlyCosts: 'Monthly Costs',
    financial: 'Financial',
    coldRent: 'Net Rent',
    additionalCosts: 'Additional Costs',
    heating: 'Heating',
    total: 'Total',
    depositInfo: 'Deposit Information',
    depositNote: 'Deposit: 3 months rent ({amount}). Heating costs are included in additional costs.',
    location: 'Location',
    address: 'Address',
    city: 'City',
    postalCode: 'Postal Code',
    area: 'Area',
    roomCount: 'Room Count',
    floor: 'Floor',
    heatingType: 'Heating',
    centralHeating: 'Central',
    active: 'Active',
    rented: 'Rented',
    empty: 'Empty',
    balcony: 'Balcony',
    livingRoom: 'Living Room',
    basement: 'Basement',
    footer: 'You viewed this page by scanning a QR code. Please contact your real estate agent for more information.',
  },
  de: {
    loading: 'Laden...',
    notFound: 'Wohnung nicht gefunden',
    notFoundMessage: 'Diese Wohnung existiert nicht oder ist nicht mehr verfügbar.',
    mainData: 'Stammdaten',
    basicInfo: 'Grundinformationen',
    unitNumber: 'Wohnungsnummer',
    apartmentType: 'Wohnungstyp',
    bedrooms: 'Schlafzimmer',
    bathrooms: 'Badezimmer',
    lastRenovation: 'Letzte Renovierung',
    internetSpeed: 'Internetgeschwindigkeit',
    equipmentFeatures: 'Ausstattung & Merkmale',
    apartmentFeatures: 'Wohnungsmerkmale',
    noFeatures: 'Keine Merkmalsinformationen verfügbar.',
    basementArea: 'Kellerfläche',
    heatingEnergy: 'Heizung & Energieeffizienz',
    technicalDetails: 'Technische Details',
    heatingSystems: 'Heizsysteme',
    primarySystem: 'Primärsystem',
    backupSystem: 'Reservesystem',
    energyCertificate: 'Energieausweis',
    certificateType: 'Ausweistyp',
    energyConsumption: 'Energieverbrauch',
    constructionYear: 'Baujahr',
    monthlyCosts: 'Monatliche Kosten',
    financial: 'Finanziell',
    coldRent: 'Kaltmiete',
    additionalCosts: 'Nebenkosten',
    heating: 'Heizung',
    total: 'Gesamt',
    depositInfo: 'Kaution-Information',
    depositNote: 'Kaution: 3 Monatsmieten ({amount}). Heizkosten sind in den Nebenkosten enthalten.',
    location: 'Standort',
    address: 'Adresse',
    city: 'Stadt',
    postalCode: 'Postleitzahl',
    area: 'Fläche',
    roomCount: 'Zimmeranzahl',
    floor: 'Etage',
    heatingType: 'Heizung',
    centralHeating: 'Zentral',
    active: 'Aktiv',
    rented: 'Vermietet',
    empty: 'Leer',
    balcony: 'Balkon',
    livingRoom: 'Wohnzimmer',
    basement: 'Keller',
    footer: 'Sie haben diese Seite durch Scannen eines QR-Codes angezeigt. Für weitere Informationen wenden Sie sich bitte an Ihren Immobilienmakler.',
  },
  ar: {
    loading: 'جاري التحميل...',
    notFound: 'الشقة غير موجودة',
    notFoundMessage: 'هذه الشقة غير موجودة أو لم تعد منشورة.',
    mainData: 'البيانات الرئيسية',
    basicInfo: 'المعلومات الأساسية',
    unitNumber: 'رقم الوحدة',
    apartmentType: 'نوع الشقة',
    bedrooms: 'غرف النوم',
    bathrooms: 'الحمامات',
    lastRenovation: 'آخر تجديد',
    internetSpeed: 'سرعة الإنترنت',
    equipmentFeatures: 'المعدات والميزات',
    apartmentFeatures: 'ميزات الشقة',
    noFeatures: 'لا تتوفر معلومات عن الميزات.',
    basementArea: 'مساحة القبو',
    heatingEnergy: 'التدفئة وكفاءة الطاقة',
    technicalDetails: 'التفاصيل الفنية',
    heatingSystems: 'أنظمة التدفئة',
    primarySystem: 'النظام الرئيسي',
    backupSystem: 'النظام الاحتياطي',
    energyCertificate: 'شهادة الطاقة',
    certificateType: 'نوع الشهادة',
    energyConsumption: 'استهلاك الطاقة',
    constructionYear: 'سنة البناء',
    monthlyCosts: 'التكاليف الشهرية',
    financial: 'المالية',
    coldRent: 'الإيجار الأساسي',
    additionalCosts: 'التكاليف الإضافية',
    heating: 'التدفئة',
    total: 'المجموع',
    depositInfo: 'معلومات التأمين',
    depositNote: 'التأمين: إيجار 3 أشهر ({amount}). تكاليف التدفئة مشمولة في التكاليف الإضافية.',
    location: 'الموقع',
    address: 'العنوان',
    city: 'المدينة',
    postalCode: 'الرمز البريدي',
    area: 'المساحة',
    roomCount: 'عدد الغرف',
    floor: 'الطابق',
    heatingType: 'التدفئة',
    centralHeating: 'مركزية',
    active: 'نشط',
    rented: 'مؤجر',
    empty: 'فارغ',
    balcony: 'شرفة',
    livingRoom: 'غرفة المعيشة',
    basement: 'قبو',
    footer: 'لقد شاهدت هذه الصفحة عن طريق مسح رمز QR. يرجى الاتصال بوكيلك العقاري للحصول على مزيد من المعلومات.',
  },
};

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
  // Get translations for current locale
  const t = translations[locale] || translations.tr;

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
            <Text c="dimmed">{t.loading}</Text>
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
          title={t.notFound}
          color="red"
          variant="filled"
        >
          {error instanceof Error ? error.message : t.notFoundMessage}
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
  const primaryHeating = heatingSystems?.find(h => h.isPrimary)?.type || heatingSystems?.[0]?.type || t.centralHeating;

  // Feature badges based on actual schema fields
  const activeFeatures = [
    { label: t.balcony, icon: IconBalloon, color: 'pink', available: apartment.balcony },
    { label: t.livingRoom, icon: IconHome, color: 'blue', available: apartment.livingRoom },
    { label: t.basement, icon: IconBuildingWarehouse, color: 'gray', available: apartment.basementSize && Number(apartment.basementSize) > 0 },
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
                      <Badge color="green" variant="filled" size="sm" tt="uppercase">{t.active}</Badge>
                      {apartment.status === 'rented' && (
                        <Badge color="blue" variant="filled" size="sm" tt="uppercase">{t.rented}</Badge>
                      )}
                      {apartment.status === 'empty' && (
                        <Badge color="yellow" variant="filled" size="sm" tt="uppercase">{t.empty}</Badge>
                      )}
                    </Group>
                    <Title order={2} c="white">{apartment.apartmentType || apartment.unitNumber}</Title>
                    <Text size="sm" c="gray.3">{apartment.property?.address || ''}</Text>
                  </Box>
                </Box>

                {/* İstatistik Grid */}
                <SimpleGrid cols={2} spacing={0}>
                  <Box p="md" ta="center" style={{ borderRight: '1px solid var(--mantine-color-gray-3)', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{t.area}</Text>
                    <Text size="xl" fw={700} mt={4}>{apartment.area || '-'} m²</Text>
                  </Box>
                  <Box p="md" ta="center" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{t.roomCount}</Text>
                    <Text size="xl" fw={700} mt={4}>{apartment.roomCount || '-'}</Text>
                  </Box>
                  <Box p="md" ta="center" style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{t.floor}</Text>
                    <Text size="xl" fw={700} mt={4}>{apartment.floor || '-'}</Text>
                  </Box>
                  <Box p="md" ta="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{t.heatingType}</Text>
                    <Text size="xl" fw={700} mt={4}>{apartment.heatingType || t.centralHeating}</Text>
                  </Box>
                </SimpleGrid>
              </Paper>

              {/* Konum Bilgisi */}
              <Paper p="lg" radius="lg" withBorder>
                <Group gap="xs" mb="md">
                  <IconMapPin size={20} />
                  <Title order={4}>{t.location}</Title>
                </Group>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t.address}</Text>
                    <Text size="sm" fw={500}>{apartment.property?.address || '-'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t.city}</Text>
                    <Text size="sm" fw={500}>{apartment.property?.city || '-'}</Text>
                  </Group>
                  {apartment.property?.postalCode && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t.postalCode}</Text>
                      <Text size="sm" fw={500}>{apartment.property.postalCode}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>

              {/* Depozito Bilgisi */}
              <Paper p="lg" radius="lg" withBorder bg="blue.0">
                <Group gap="xs" mb="sm">
                  <IconInfoCircle size={18} color="var(--mantine-color-blue-6)" />
                  <Text size="sm" fw={500} c="blue.8">{t.depositInfo}</Text>
                </Group>
                <Text size="sm" c="blue.7">
                  {t.depositNote.replace('{amount}', formatCurrency(deposit, locale))}
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
                title={t.mainData}
                subtitle={t.basicInfo}
              >
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{t.unitNumber}</Text>
                    <Text size="md">{apartment.unitNumber}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{t.apartmentType}</Text>
                    <Text size="md">{apartment.apartmentType || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{t.bedrooms}</Text>
                    <Text size="md">{apartment.bedroomCount || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{t.bathrooms}</Text>
                    <Text size="md">{apartment.bathroomCount || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{t.lastRenovation}</Text>
                    <Text size="md">{apartment.lastRenovationDate ? new Date(apartment.lastRenovationDate).getFullYear() : '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>{t.internetSpeed}</Text>
                    <Text size="md">{apartment.internetSpeed || '-'}</Text>
                  </Box>
                </SimpleGrid>
              </TimelineItem>

              {/* Donanım & Özellikler */}
              <TimelineItem
                icon={<IconCheck size={20} />}
                iconColor="green"
                iconBg="var(--mantine-color-green-0)"
                title={t.equipmentFeatures}
                subtitle={t.apartmentFeatures}
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
                  <Text size="sm" c="dimmed">{t.noFeatures}</Text>
                )}
                {apartment.basementSize && Number(apartment.basementSize) > 0 && (
                  <>
                    <Divider my="md" />
                    <Text size="sm">{t.basementArea}: <strong>{Number(apartment.basementSize)} m²</strong></Text>
                  </>
                )}
              </TimelineItem>

              {/* Isıtma & Enerji */}
              <TimelineItem
                icon={<IconFlame size={20} />}
                iconColor="orange"
                iconBg="var(--mantine-color-orange-0)"
                title={t.heatingEnergy}
                subtitle={t.technicalDetails}
              >
                <Stack gap="md">
                  <Paper p="md" bg="gray.0" radius="md">
                    <Text size="sm" fw={600} mb="sm">{t.heatingSystems}</Text>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                      <Box>
                        <Text size="xs" c="dimmed" mb={4}>{t.primarySystem}</Text>
                        <Text size="sm" fw={500}>{primaryHeating}</Text>
                      </Box>
                      {heatingSystems && heatingSystems.length > 1 && (
                        <Box>
                          <Text size="xs" c="dimmed" mb={4}>{t.backupSystem}</Text>
                          <Text size="sm" fw={500}>{heatingSystems[1]?.type || '-'}</Text>
                        </Box>
                      )}
                    </SimpleGrid>
                  </Paper>

                  <Box>
                    <Text size="sm" fw={600} mb="sm">{t.energyCertificate}</Text>
                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
                      <Paper p="sm" radius="sm" withBorder>
                        <Text size="xs" c="dimmed" mb={4}>{t.certificateType}</Text>
                        <Text size="sm" fw={500}>{apartment.energyCertificateType || '-'}</Text>
                      </Paper>
                      <Paper p="sm" radius="sm" withBorder>
                        <Text size="xs" c="dimmed" mb={4}>{t.energyConsumption}</Text>
                        <Text size="sm" fw={500}>{apartment.energyConsumption ? `${Number(apartment.energyConsumption)} kWh/(m²*a)` : '-'}</Text>
                      </Paper>
                      <Paper p="sm" radius="sm" withBorder>
                        <Text size="xs" c="dimmed" mb={4}>{t.constructionYear}</Text>
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
                title={t.monthlyCosts}
                subtitle={t.financial}
                isLast
              >
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm" mb="md">
                  <Paper p="md" bg="gray.0" radius="md">
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>{t.coldRent}</Text>
                    <Text size="lg" fw={700}>{formatCurrency(coldRent, locale)}</Text>
                  </Paper>
                  <Paper p="md" bg="gray.0" radius="md">
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>{t.additionalCosts}</Text>
                    <Text size="lg" fw={700}>{formatCurrency(additionalCosts, locale)}</Text>
                  </Paper>
                  <Paper p="md" bg="gray.0" radius="md">
                    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>{t.heating}</Text>
                    <Text size="lg" fw={700}>{formatCurrency(heatingCosts, locale)}</Text>
                  </Paper>
                  <Paper p="md" bg="blue.0" radius="md" style={{ border: '1px solid var(--mantine-color-blue-2)' }}>
                    <Text size="xs" c="blue" tt="uppercase" fw={600} mb={4}>{t.total}</Text>
                    <Text size="lg" fw={700} c="blue">{formatCurrency(totalRent, locale)}</Text>
                  </Paper>
                </SimpleGrid>
                <Group gap="xs">
                  <IconInfoCircle size={16} color="gray" />
                  <Text size="sm" c="dimmed">
                    {t.depositNote.replace('{amount}', formatCurrency(deposit, locale))}
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
            {t.footer}
          </Text>
        </Group>
      </Paper>
    </Container>
  );
}
