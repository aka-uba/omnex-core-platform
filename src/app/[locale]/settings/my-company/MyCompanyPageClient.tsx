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

  const handleImageUpload = async (file: File, type: 'logo' | 'favicon' | 'pwaIcon') => {
    setLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('type', type);
      if (company?.id) {
        uploadData.append('companyId', company.id);
      }

      const response = await fetchWithAuth('/api/company/logo', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (result.success) {
        // Immediately update formData with the new image URL
        const urlField = type === 'logo' ? 'logo' : type === 'favicon' ? 'favicon' : 'pwaIcon';
        const fileField = type === 'logo' ? 'logoFile' : type === 'favicon' ? 'faviconFile' : 'pwaIconFile';
        setFormData(prev => ({
          ...prev,
          [urlField]: result.data[`${type}Url`] || result.data.logoUrl,
          [fileField]: result.data[`${type}File`] || result.data.logoFile,
        }));

        const messageKey = type === 'logo' ? 'companies.logoUploaded' :
                          type === 'favicon' ? 'companies.faviconUploaded' :
                          'companies.pwaIconUploaded';
        showToast({
          type: 'success',
          title: t('success'),
          message: t(messageKey),
        });
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

  const handleLogoUpload = (file: File) => handleImageUpload(file, 'logo');
  const handleFaviconUpload = (file: File) => handleImageUpload(file, 'favicon');
  const handlePwaIconUpload = (file: File) => handleImageUpload(file, 'pwaIcon');

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
              {/* Logo, Favicon, PWA Icon - Yan Yana Card'lar */}
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
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
                        padding: '12px',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 100,
                        width: '100%',
                      }}
                    >
                      {formData.logo ? (
                        <Image
                          src={formData.logo}
                          alt={formData.name || 'Logo'}
                          fit="contain"
                          maw={120}
                          mah={80}
                        />
                      ) : (
                        <IconBuilding size={40} color="var(--mantine-color-gray-5)" />
                      )}
                    </Box>
                    <Stack gap="xs" align="center" w="100%">
                      <Group gap="xs" justify="center">
                        <FileButton onChange={(file) => file && handleLogoUpload(file)} accept="image/*">
                          {(props) => (
                            <Button {...props} leftSection={<IconUpload size={14} />} variant="light" size="xs">
                              {formData.logo
                                ? t('companies.changeLogo')
                                : t('companies.uploadLogo')
                              }
                            </Button>
                          )}
                        </FileButton>
                        {formData.logo && (
                          <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={async () => {
                              setFormData({ ...formData, logo: null, logoFile: null });
                            }}
                          >
                            {t('companies.removeLogo')}
                          </Button>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed" ta="center">
                        {t('companies.logoHint')}
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
                        padding: '12px',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 100,
                        width: '100%',
                      }}
                    >
                      {formData.favicon ? (
                        <Image
                          src={formData.favicon}
                          alt="Favicon"
                          fit="contain"
                          maw={48}
                          mah={48}
                        />
                      ) : (
                        <IconWorld size={32} color="var(--mantine-color-gray-5)" />
                      )}
                    </Box>
                    <Stack gap="xs" align="center" w="100%">
                      <Group gap="xs" justify="center">
                        <FileButton onChange={(file) => file && handleFaviconUpload(file)} accept="image/*,.ico">
                          {(props) => (
                            <Button {...props} leftSection={<IconUpload size={14} />} variant="light" size="xs">
                              {formData.favicon
                                ? t('companies.changeFavicon')
                                : t('companies.uploadFavicon')
                              }
                            </Button>
                          )}
                        </FileButton>
                        {formData.favicon && (
                          <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={async () => {
                              setFormData({ ...formData, favicon: null, faviconFile: null });
                            }}
                          >
                            {t('companies.removeFavicon')}
                          </Button>
                        )}
                      </Group>
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
                        padding: '12px',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 100,
                        width: '100%',
                      }}
                    >
                      {formData.pwaIcon ? (
                        <Image
                          src={formData.pwaIcon}
                          alt="PWA Icon"
                          fit="contain"
                          maw={72}
                          mah={72}
                        />
                      ) : (
                        <IconDeviceFloppy size={32} color="var(--mantine-color-gray-5)" />
                      )}
                    </Box>
                    <Stack gap="xs" align="center" w="100%">
                      <Group gap="xs" justify="center">
                        <FileButton onChange={(file) => file && handlePwaIconUpload(file)} accept="image/png,image/svg+xml">
                          {(props) => (
                            <Button {...props} leftSection={<IconUpload size={14} />} variant="light" size="xs">
                              {formData.pwaIcon
                                ? t('companies.changePwaIcon')
                                : t('companies.uploadPwaIcon')
                              }
                            </Button>
                          )}
                        </FileButton>
                        {formData.pwaIcon && (
                          <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={async () => {
                              setFormData({ ...formData, pwaIcon: null, pwaIconFile: null });
                            }}
                          >
                            {t('companies.removePwaIcon')}
                          </Button>
                        )}
                      </Group>
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

