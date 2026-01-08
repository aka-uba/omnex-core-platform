'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container, Title, Text, Divider, Box, LoadingOverlay, Select, Paper, Group } from '@mantine/core';
import { IconTemplate, IconHome } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { ApartmentDesignV1 } from './designs/ApartmentDesignV1';
import { ApartmentDesignV2 } from './designs/ApartmentDesignV2';
import { ApartmentDesignV3 } from './designs/ApartmentDesignV3';

interface DesignPreviewPageClientProps {
  locale: string;
}

interface ApartmentOption {
  id: string;
  unitNumber: string;
  apartmentType?: string;
  property?: {
    name?: string;
    address?: string;
  };
}

export function DesignPreviewPageClient({ locale }: DesignPreviewPageClientProps) {
  const { t } = useTranslation('modules/real-estate');
  const [apartments, setApartments] = useState<ApartmentOption[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [apartment, setApartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch all apartments for dropdown
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const response = await fetchWithAuth('/api/real-estate/apartments?page=1&pageSize=100');
        const data = await response.json();
        if (data.success && data.data?.apartments) {
          setApartments(data.data.apartments);
          // Auto-select first apartment
          if (data.data.apartments.length > 0) {
            setSelectedApartmentId(data.data.apartments[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching apartments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, []);

  // Fetch selected apartment details
  useEffect(() => {
    if (!selectedApartmentId) {
      setApartment(null);
      return;
    }

    const fetchApartmentDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await fetchWithAuth(`/api/real-estate/apartments/${selectedApartmentId}`);
        const data = await response.json();
        if (data.success && data.data?.apartment) {
          setApartment(data.data.apartment);
        }
      } catch (error) {
        console.error('Error fetching apartment details:', error);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchApartmentDetail();
  }, [selectedApartmentId]);

  // Prepare select options
  const selectOptions = useMemo(() => {
    return apartments.map((apt) => ({
      value: apt.id,
      label: `${apt.unitNumber}${apt.apartmentType ? ` - ${apt.apartmentType}` : ''}${apt.property?.name ? ` (${apt.property.name})` : ''}`,
    }));
  }, [apartments]);

  if (loading) {
    return (
      <Container size="xl" pt="xl">
        <Box pos="relative" mih={400}>
          <LoadingOverlay visible={true} />
        </Box>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl" pb="xl">
      <CentralPageHeader
        title={t('designPreview.title')}
        description={t('designPreview.description')}
        namespace="modules/real-estate"
        icon={<IconTemplate size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${locale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: 'designPreview.title', namespace: 'modules/real-estate' },
        ]}
      />

      {/* Apartment Selection */}
      <Paper shadow="xs" p="md" radius="md" withBorder mt="lg">
        <Group align="flex-end" gap="md">
          <Select
            label={t('designPreview.selectApartment')}
            placeholder={t('designPreview.selectApartmentPlaceholder')}
            data={selectOptions}
            value={selectedApartmentId}
            onChange={setSelectedApartmentId}
            searchable
            clearable={false}
            leftSection={<IconHome size={16} />}
            style={{ flex: 1, maxWidth: 500 }}
          />
          {apartments.length === 0 && (
            <Text c="dimmed" size="sm">
              {t('designPreview.noApartment')}
            </Text>
          )}
        </Group>
      </Paper>

      {/* Loading state for apartment detail */}
      {loadingDetail && (
        <Box pos="relative" mih={400} mt="xl">
          <LoadingOverlay visible={true} />
        </Box>
      )}

      {/* No apartment selected or available */}
      {!loadingDetail && !apartment && (
        <Text c="dimmed" ta="center" mt="xl">
          {apartments.length === 0
            ? t('designPreview.noApartment')
            : t('designPreview.selectApartmentPrompt')
          }
        </Text>
      )}

      {/* Designs */}
      {!loadingDetail && apartment && (
        <>
          {/* V1 - Split Panel Design */}
          <Box mt="xl">
            <Title order={2} mb="xs">{t('designPreview.v1.title')}</Title>
            <Text c="dimmed" size="sm" mb="md">
              {t('designPreview.v1.description')}
            </Text>
            <Divider mb="lg" />
            <ApartmentDesignV1 apartment={apartment} locale={locale} />
          </Box>

          {/* V2 - Interactive Overview Design */}
          <Box mt={60}>
            <Title order={2} mb="xs">{t('designPreview.v2.title')}</Title>
            <Text c="dimmed" size="sm" mb="md">
              {t('designPreview.v2.description')}
            </Text>
            <Divider mb="lg" />
            <ApartmentDesignV2 apartment={apartment} locale={locale} />
          </Box>

          {/* V3 - Timeline Features Design */}
          <Box mt={60}>
            <Title order={2} mb="xs">{t('designPreview.v3.title')}</Title>
            <Text c="dimmed" size="sm" mb="md">
              {t('designPreview.v3.description')}
            </Text>
            <Divider mb="lg" />
            <ApartmentDesignV3 apartment={apartment} locale={locale} />
          </Box>
        </>
      )}
    </Container>
  );
}
