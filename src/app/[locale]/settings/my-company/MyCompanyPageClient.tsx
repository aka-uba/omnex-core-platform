'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Paper,
  TextInput,
  Textarea,
  Button,
  Group,
  Tabs,
  Text,
  Alert,
  FileButton,
  SimpleGrid,
  Divider,
  Badge,
  Box,
  Image,
} from '@mantine/core';
import {
  IconBuilding,
  IconDeviceFloppy,
  IconUpload,
  IconMail,
  IconPhone,
  IconWorld,
  IconMapPin,
  IconFileText,
  IconCreditCard,
  IconInfoCircle,
  IconUsers,
  IconCalendar,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { MyCompanyPageSkeleton } from './MyCompanyPageSkeleton';
import { BRANDING_PATHS } from '@/lib/branding/config';
import { useBranding } from '@/hooks/useBranding';

interface CompanyData {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  status: string;
  logo: string | null;
  logoFile: string | null;
  favicon: string | null;
  faviconFile: string | null;
  pwaIcon: string | null;
  pwaIconFile: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  registrationNumber: string | null;
  mersisNumber: string | null;
  iban: string | null;
  bankName: string | null;
  accountHolder: string | null;
  description: string | null;
  foundedYear: number | null;
  employeeCount: number | null;
  capital: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    usersCount: number;
    assetsCount: number;
    contentsCount: number;
    websitesCount: number;
  };
}

export function MyCompanyPageClient({ locale }: { locale: string }) {
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('global');
  const [, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyData>>({});
  const [activeTab, setActiveTab] = useState<string | null>('basic');

  const { data: company, isLoading, error, refetch } = useQuery<CompanyData>({
    queryKey: ['myCompany'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/company');
      if (!response.ok) {
        throw new Error('Failed to fetch company');
      }
      const result = await response.json();
      return result.data;
    },
  });

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: t('success'),
          message: t('companies.updated'),
        });
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('error'),
        message: error.message || t('companies.updateError'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Branding hook - sabit dosya yollarını kullanır
  const { refetch: refetchBranding } = useBranding();

  type BrandingType = 'logo' | 'logoLight' | 'logoDark' | 'favicon' | 'pwaIcon';

  const handleBrandingUpload = async (file: File, type: BrandingType) => {
    setLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('type', type);

      // Yeni branding API'yi kullan - sabit dosya isimlerine yazar
      const response = await fetchWithAuth('/api/branding/upload', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (result.success) {
        const messageKey = type === 'logo' ? 'companies.logoUploaded' :
                          type === 'logoLight' ? 'companies.logoLightUploaded' :
                          type === 'logoDark' ? 'companies.logoDarkUploaded' :
                          type === 'favicon' ? 'companies.faviconUploaded' :
                          'companies.pwaIconUploaded';
        showToast({
          type: 'success',
          title: t('success'),
          message: t(messageKey),
        });
        // Branding hook'u yenile
        refetchBranding();
        // Company data'yı da yenile
        refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('error'),
        message: error.message || t('companies.logoUploadError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBrandingDelete = async (type: BrandingType) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/branding/upload?type=${type}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: t('success'),
          message: t('common.deleted'),
        });
        refetchBranding();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('error'),
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (file: File) => handleBrandingUpload(file, 'logo');
  const handleLogoLightUpload = (file: File) => handleBrandingUpload(file, 'logoLight');
  const handleLogoDarkUpload = (file: File) => handleBrandingUpload(file, 'logoDark');
  const handleFaviconUpload = (file: File) => handleBrandingUpload(file, 'favicon');
  const handlePwaIconUpload = (file: File) => handleBrandingUpload(file, 'pwaIcon');

  if (isLoading) {
    return <MyCompanyPageSkeleton />;
  }

  if (error) {
    return (
      <Container size="xl" pt="xl">
        <Alert color="red" title={t('error')}>
          {error instanceof Error ? error.message : t('companies.loadError')}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('companies.myCompany')}
        description={t('companies.myCompanyDescription')}
        namespace="global"
        icon={<IconBuilding size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'navigation.settings', href: `/${currentLocale}/settings`, namespace: 'global' },
          { label: 'companies.myCompany', namespace: 'global' },
        ]}
        actions={[
          {
            label: t('save'),
            icon: <IconDeviceFloppy size={18} />,
            onClick: handleSave,
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="md" mt="xl">
        <Tabs value={activeTab || 'basic'} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="basic" leftSection={<IconInfoCircle size={16} />}>
              {t('companies.tabs.basic')}
            </Tabs.Tab>
            <Tabs.Tab value="contact" leftSection={<IconPhone size={16} />}>
              {t('companies.tabs.contact')}
            </Tabs.Tab>
            <Tabs.Tab value="legal" leftSection={<IconFileText size={16} />}>
              {t('companies.tabs.legal')}
            </Tabs.Tab>
            <Tabs.Tab value="financial" leftSection={<IconCreditCard size={16} />}>
              {t('companies.tabs.financial')}
            </Tabs.Tab>
            <Tabs.Tab value="additional" leftSection={<IconInfoCircle size={16} />}>
              {t('companies.tabs.additional')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basic" pt="xl">
            <Stack gap="md">
              {/* Logo, Logo Light, Logo Dark, Favicon, PWA Icon - 5 Card Yan Yana */}
              {/* Sabit dosya yollarını kullanarak göster - /branding/logo.png vb. */}
              <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }} spacing="md">
                {/* Logo Upload Card */}
                <Paper p="md" withBorder>
                  <Stack gap="md" align="center">
                    <Text size="sm" fw={500}>
                      {t('companies.logo')}
                    </Text>
                    <Box
                      style={{
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        padding: '8px',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 80,
                        width: '100%',
                      }}
                    >
                      <Image
                        src={`${BRANDING_PATHS.logo}?t=${Date.now()}`}
                        alt={formData.name || 'Logo'}
                        fit="contain"
                        maw={100}
                        mah={60}
                        fallbackSrc=""
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon';
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--mantine-color-gray-5)" stroke-width="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    </Box>
                    <Stack gap="xs" align="center" w="100%">
                      <FileButton onChange={(file) => file && handleLogoUpload(file)} accept="image/*">
                        {(props) => (
                          <Button {...props} leftSection={<IconUpload size={14} />} variant="light" size="xs" fullWidth>
                            {t('common.actions.upload')}
                          </Button>
                        )}
                      </FileButton>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        fullWidth
                        onClick={() => handleBrandingDelete('logo')}
                      >
                        {t('common.actions.delete')}
                      </Button>
                      <Text size="xs" c="dimmed" ta="center">
                        {t('companies.logoHint')}
                      </Text>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Logo Light Upload Card */}
                <Paper p="md" withBorder>
                  <Stack gap="md" align="center">
                    <Text size="sm" fw={500}>
                      {t('companies.logoLight')}
                    </Text>
                    <Box
                      style={{
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        padding: '8px',
                        backgroundColor: 'var(--mantine-color-dark-7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 80,
                        width: '100%',
                      }}
                    >
                      <Image
                        src={`${BRANDING_PATHS.logoLight}?t=${Date.now()}`}
                        alt="Logo Light"
                        fit="contain"
                        maw={100}
                        mah={60}
                        fallbackSrc=""
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon';
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--mantine-color-gray-5)" stroke-width="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    </Box>
                    <Stack gap="xs" align="center" w="100%">
                      <FileButton onChange={(file) => file && handleLogoLightUpload(file)} accept="image/*">
                        {(props) => (
                          <Button {...props} leftSection={<IconUpload size={14} />} variant="light" size="xs" fullWidth>
                            {t('common.actions.upload')}
                          </Button>
                        )}
                      </FileButton>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        fullWidth
                        onClick={() => handleBrandingDelete('logoLight')}
                      >
                        {t('common.actions.delete')}
                      </Button>
                      <Text size="xs" c="dimmed" ta="center">
                        {t('companies.logoLightHint')}
                      </Text>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Logo Dark Upload Card */}
                <Paper p="md" withBorder>
                  <Stack gap="md" align="center">
                    <Text size="sm" fw={500}>
                      {t('companies.logoDark')}
                    </Text>
                    <Box
                      style={{
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        padding: '8px',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 80,
                        width: '100%',
                      }}
                    >
                      <Image
                        src={`${BRANDING_PATHS.logoDark}?t=${Date.now()}`}
                        alt="Logo Dark"
                        fit="contain"
                        maw={100}
                        mah={60}
                        fallbackSrc=""
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon';
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--mantine-color-gray-5)" stroke-width="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    </Box>
                    <Stack gap="xs" align="center" w="100%">
                      <FileButton onChange={(file) => file && handleLogoDarkUpload(file)} accept="image/*">
                        {(props) => (
                          <Button {...props} leftSection={<IconUpload size={14} />} variant="light" size="xs" fullWidth>
                            {t('common.actions.upload')}
                          </Button>
                        )}
                      </FileButton>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        fullWidth
                        onClick={() => handleBrandingDelete('logoDark')}
                      >
                        {t('common.actions.delete')}
                      </Button>
                      <Text size="xs" c="dimmed" ta="center">
                        {t('companies.logoDarkHint')}
                      </Text>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Favicon Upload Card */}
                <Paper p="md" withBorder>
                  <Stack gap="md" align="center">
                    <Text size="sm" fw={500}>
                      {t('companies.favicon')}
                    </Text>
                    <Box
                      style={{
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        padding: '8px',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 80,
                        width: '100%',
                      }}
                    >
                      <Image
                        src={`${BRANDING_PATHS.favicon}?t=${Date.now()}`}
                        alt="Favicon"
                        fit="contain"
                        maw={48}
                        mah={48}
                        fallbackSrc=""
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon';
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--mantine-color-gray-5)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    </Box>
                    <Stack gap="xs" align="center" w="100%">
                      <FileButton onChange={(file) => file && handleFaviconUpload(file)} accept="image/*,.ico">
                        {(props) => (
                          <Button {...props} leftSection={<IconUpload size={14} />} variant="light" size="xs" fullWidth>
                            {t('common.actions.upload')}
                          </Button>
                        )}
                      </FileButton>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        fullWidth
                        onClick={() => handleBrandingDelete('favicon')}
                      >
                        {t('common.actions.delete')}
                      </Button>
                      <Text size="xs" c="dimmed" ta="center">
                        {t('companies.faviconHint')}
                      </Text>
                    </Stack>
                  </Stack>
                </Paper>

                {/* PWA Icon Upload Card */}
                <Paper p="md" withBorder>
                  <Stack gap="md" align="center">
                    <Text size="sm" fw={500}>
                      {t('companies.pwaIcon')}
                    </Text>
                    <Box
                      style={{
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        padding: '8px',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 80,
                        width: '100%',
                      }}
                    >
                      <Image
                        src={`${BRANDING_PATHS.pwaIcon}?t=${Date.now()}`}
                        alt="PWA Icon"
                        fit="contain"
                        maw={60}
                        mah={60}
                        fallbackSrc=""
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const icon = document.createElement('div');
                            icon.className = 'fallback-icon';
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--mantine-color-gray-5)" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    </Box>
                    <Stack gap="xs" align="center" w="100%">
                      <FileButton onChange={(file) => file && handlePwaIconUpload(file)} accept="image/png,image/svg+xml">
                        {(props) => (
                          <Button {...props} leftSection={<IconUpload size={14} />} variant="light" size="xs" fullWidth>
                            {t('common.actions.upload')}
                          </Button>
                        )}
                      </FileButton>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        fullWidth
                        onClick={() => handleBrandingDelete('pwaIcon')}
                      >
                        {t('common.actions.delete')}
                      </Button>
                      <Text size="xs" c="dimmed" ta="center">
                        {t('companies.pwaIconHint')}
                      </Text>
                    </Stack>
                  </Stack>
                </Paper>
              </SimpleGrid>

              <TextInput
                label={t('companies.form.name')}
                placeholder={t('companies.form.namePlaceholder')}
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                required
                leftSection={<IconBuilding size={16} />}
              />

              <TextInput
                label={t('companies.form.industry')}
                placeholder={t('companies.form.industryPlaceholder')}
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.currentTarget.value })}
                leftSection={<IconInfoCircle size={16} />}
              />

              <TextInput
                label={t('companies.form.website')}
                placeholder={t('companies.form.websitePlaceholder')}
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.currentTarget.value })}
                leftSection={<IconWorld size={16} />}
              />

              <Textarea
                label={t('companies.form.description')}
                placeholder={t('companies.form.descriptionPlaceholder')}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                rows={4}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label={t('companies.form.foundedYear')}
                  placeholder={t('companies.form.foundedYearPlaceholder')}
                  value={formData.foundedYear?.toString() || ''}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.currentTarget.value ? parseInt(e.currentTarget.value) : null })}
                  type="number"
                  leftSection={<IconCalendar size={16} />}
                />

                <TextInput
                  label={t('companies.form.employeeCount')}
                  placeholder={t('companies.form.employeeCountPlaceholder')}
                  value={formData.employeeCount?.toString() || ''}
                  onChange={(e) => setFormData({ ...formData, employeeCount: e.currentTarget.value ? parseInt(e.currentTarget.value) : null })}
                  type="number"
                  leftSection={<IconUsers size={16} />}
                />
              </SimpleGrid>

              <TextInput
                label={t('companies.form.capital')}
                placeholder={t('companies.form.capitalPlaceholder')}
                value={formData.capital || ''}
                onChange={(e) => setFormData({ ...formData, capital: e.currentTarget.value })}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="contact" pt="xl">
            <Stack gap="md">
              <Textarea
                label={t('companies.form.address')}
                placeholder={t('companies.form.addressPlaceholder')}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.currentTarget.value })}
                rows={3}
                autoComplete="street-address"
                leftSection={<IconMapPin size={16} />}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label={t('companies.form.city')}
                  placeholder={t('companies.form.cityPlaceholder')}
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.currentTarget.value })}
                  autoComplete="address-level2"
                />

                <TextInput
                  label={t('companies.form.state')}
                  placeholder={t('companies.form.statePlaceholder')}
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.currentTarget.value })}
                  autoComplete="address-level1"
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label={t('companies.form.postalCode')}
                  placeholder={t('companies.form.postalCodePlaceholder')}
                  value={formData.postalCode || ''}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.currentTarget.value })}
                  autoComplete="postal-code"
                />

                <TextInput
                  label={t('companies.form.country')}
                  placeholder={t('companies.form.countryPlaceholder')}
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.currentTarget.value })}
                  autoComplete="country"
                />
              </SimpleGrid>

              <Divider />

              <TextInput
                label={t('companies.form.phone')}
                placeholder={t('companies.form.phonePlaceholder')}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.currentTarget.value })}
                type="tel"
                autoComplete="tel"
                leftSection={<IconPhone size={16} />}
              />

              <TextInput
                label={t('companies.form.email')}
                placeholder={t('companies.form.emailPlaceholder')}
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.currentTarget.value })}
                type="email"
                autoComplete="email"
                leftSection={<IconMail size={16} />}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="legal" pt="xl">
            <Stack gap="md">
              <TextInput
                label={t('companies.form.taxNumber')}
                placeholder={t('companies.form.taxNumberPlaceholder')}
                value={formData.taxNumber || ''}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.currentTarget.value })}
              />

              <TextInput
                label={t('companies.form.taxOffice')}
                placeholder={t('companies.form.taxOfficePlaceholder')}
                value={formData.taxOffice || ''}
                onChange={(e) => setFormData({ ...formData, taxOffice: e.currentTarget.value })}
              />

              <TextInput
                label={t('companies.form.registrationNumber')}
                placeholder={t('companies.form.registrationNumberPlaceholder')}
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.currentTarget.value })}
              />

              <TextInput
                label={t('companies.form.mersisNumber')}
                placeholder={t('companies.form.mersisNumberPlaceholder')}
                value={formData.mersisNumber || ''}
                onChange={(e) => setFormData({ ...formData, mersisNumber: e.currentTarget.value })}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="financial" pt="xl">
            <Stack gap="md">
              <TextInput
                label={t('companies.form.iban')}
                placeholder={t('companies.form.ibanPlaceholder')}
                value={formData.iban || ''}
                onChange={(e) => setFormData({ ...formData, iban: e.currentTarget.value })}
                leftSection={<IconCreditCard size={16} />}
              />

              <TextInput
                label={t('companies.form.bankName')}
                placeholder={t('companies.form.bankNamePlaceholder')}
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.currentTarget.value })}
              />

              <TextInput
                label={t('companies.form.accountHolder')}
                placeholder={t('companies.form.accountHolderPlaceholder')}
                value={formData.accountHolder || ''}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.currentTarget.value })}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="additional" pt="xl">
            <Stack gap="md">
              <Paper p="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('companies.stats.title')}
                    </Text>
                  </Group>
                  <SimpleGrid cols={{ base: 2, sm: 4 }}>
                    <Stack gap={4} align="center">
                      <IconUsers size={24} color="var(--mantine-color-blue-6)" />
                      <Text size="xl" fw={700}>
                        {company?.stats.usersCount || 0}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('companies.stats.users')}
                      </Text>
                    </Stack>
                    <Stack gap={4} align="center">
                      <IconFileText size={24} color="var(--mantine-color-green-6)" />
                      <Text size="xl" fw={700}>
                        {company?.stats.assetsCount || 0}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('companies.stats.assets')}
                      </Text>
                    </Stack>
                    <Stack gap={4} align="center">
                      <IconInfoCircle size={24} color="var(--mantine-color-violet-6)" />
                      <Text size="xl" fw={700}>
                        {company?.stats.contentsCount || 0}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('companies.stats.contents')}
                      </Text>
                    </Stack>
                    <Stack gap={4} align="center">
                      <IconWorld size={24} color="var(--mantine-color-orange-6)" />
                      <Text size="xl" fw={700}>
                        {company?.stats.websitesCount || 0}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t('companies.stats.websites')}
                      </Text>
                    </Stack>
                  </SimpleGrid>
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t('companies.info.createdAt')}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {company?.createdAt ? new Date(company.createdAt).toLocaleString(currentLocale) : '-'}
                  </Text>
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t('companies.info.updatedAt')}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {company?.updatedAt ? new Date(company.updatedAt).toLocaleString(currentLocale) : '-'}
                  </Text>
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {t('companies.info.status')}
                    </Text>
                    <Badge color={company?.status === 'Active' ? 'green' : 'gray'} variant="light">
                      {company?.status || '-'}
                    </Badge>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

