'use client';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Checkbox,
  Stack,
  Alert,
  Group,
  Select,
} from '@mantine/core';
import { IconAlertCircle, IconUser, IconLock, IconBuilding, IconCalendar, IconApps, IconDashboard, IconDatabase, IconShield, IconUsers, IconReport } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import Link from 'next/link';
import classes from './SuperAdminLoginPage.module.css';
import NextImage from 'next/image';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export function SuperAdminLoginPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      rememberMe: false,
      tenantId: '',
      periodId: '',
    },
    validate: {
      username: (value) => {
        if (!value || value.trim().length === 0) {
          return t('common.kullanici.adi.gereklidir');
        }
        return null;
      },
      password: (value) => {
        if (!value || value.trim().length === 0) {
          return t('common.sifre.gereklidir');
        }
        return null;
      },
      tenantId: (value) => {
        if (!value || value.trim().length === 0) {
          return t('common.firma.secimi.gereklidir');
        }
        return null;
      },
    },
  });

  // Fetch tenants
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/tenants?pageSize=100&status=active');
        const data = await response.json();
        if (data.success && data.data?.tenants) {
          setTenants(data.data.tenants);
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, []);

  // Fetch periods when tenant is selected
  useEffect(() => {
    if (form.values.tenantId) {
      setLoadingPeriods(true);
      const fetchPeriods = async () => {
        try {
          const selectedTenant = tenants.find(t => t.id === form.values.tenantId);
          if (selectedTenant) {
            // Try to fetch periods from API
            const response = await fetch(`/api/tenants/${selectedTenant.slug}/periods`);
            const data = await response.json();
            if (data.success && data.data?.periods) {
              setPeriods(data.data.periods);
            } else {
              // If no periods API, create default periods for last 3 years
              const currentYear = new Date().getFullYear();
              setPeriods([
                { id: `${currentYear}`, name: t('common.currentyear.yili'), startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` },
                { id: `${currentYear - 1}`, name: t('common.currentyear.1.yili'), startDate: `${currentYear - 1}-01-01`, endDate: `${currentYear - 1}-12-31` },
                { id: `${currentYear - 2}`, name: t('common.currentyear.2.yili'), startDate: `${currentYear - 2}-01-01`, endDate: `${currentYear - 2}-12-31` },
              ]);
            }
          }
        } catch (err) {
          // If periods API doesn't exist, use default
          const currentYear = new Date().getFullYear();
          setPeriods([
            { id: `${currentYear}`, name: t('common.currentyear.yili'), startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` },
            { id: `${currentYear - 1}`, name: t('common.currentyear.1.yili'), startDate: `${currentYear - 1}-01-01`, endDate: `${currentYear - 1}-12-31` },
            { id: `${currentYear - 2}`, name: t('common.currentyear.2.yili'), startDate: `${currentYear - 2}-01-01`, endDate: `${currentYear - 2}-12-31` },
          ]);
        } finally {
          setLoadingPeriods(false);
        }
      };

      fetchPeriods();
    } else {
      setPeriods([]);
      form.setFieldValue('periodId', '');
    }
  }, [form.values.tenantId, tenants]);

  // Fetch logo
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/settings/logo');
        const data = await response.json();
        if (data.success && data.data?.logoUrl) {
          setLogoUrl(data.data.logoUrl);
        }
      } catch (err) {
        // Logo yoksa varsayılan logo kullanılacak
      }
    };

    fetchLogo();
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      const selectedTenant = tenants.find(t => t.id === values.tenantId);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          tenantSlug: selectedTenant?.slug,
          periodId: values.periodId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Başarılı giriş - session'a kaydet
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.data.user));
          localStorage.setItem('selectedTenant', JSON.stringify(selectedTenant));
          if (values.periodId) {
            const selectedPeriod = periods.find(p => p.id === values.periodId);
            localStorage.setItem('selectedPeriod', JSON.stringify(selectedPeriod));
          }
          
          window.dispatchEvent(new Event('user-updated'));
          
          if (data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
          }
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
        }
        
        const targetPath = `/${locale}`;
        window.location.href = targetPath;
      } else {
        setError(data.error?.message || data.message || t('login.errors.invalidCredentials'));
      }
    } catch (err) {
      setError(t('login.errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.leftSection}>
        <div className={classes.leftContent}>
          <div className={classes.headerSection}>
            <NextImage
              src="/images/logo.png"
              alt="Omnex Logo"
              width={40}
              height={40}
              className={classes.logoImage}
            />
            <h1 className={classes.platformTitle}>Omnex Core Sass Platform</h1>
          </div>
          
          <div className={classes.modulesSection}>
            <div className={classes.modulesLeft}>
              <div className={classes.moduleItem}>
                <IconApps size={24} className={classes.moduleIcon} />
                <div className={classes.moduleInfo}>
                  <h3 className={classes.moduleTitle}>Modüler Yapı</h3>
                  <p className={classes.moduleDescription}>Esnek ve genişletilebilir modül sistemi</p>
                </div>
              </div>
              
              <div className={classes.moduleItem}>
                <IconDashboard size={24} className={classes.moduleIcon} />
                <div className={classes.moduleInfo}>
                  <h3 className={classes.moduleTitle}>Merkezi Dashboard</h3>
                  <p className={classes.moduleDescription}>Tüm verilerinizi tek yerden yönetin</p>
                </div>
              </div>
              
              <div className={classes.moduleItem}>
                <IconUsers size={24} className={classes.moduleIcon} />
                <div className={classes.moduleInfo}>
                  <h3 className={classes.moduleTitle}>Kullanıcı Yönetimi</h3>
                  <p className={classes.moduleDescription}>Gelişmiş yetkilendirme sistemi</p>
                </div>
              </div>
            </div>
            
            <div className={classes.modulesRight}>
              <div className={classes.moduleItem}>
                <IconDatabase size={24} className={classes.moduleIcon} />
                <div className={classes.moduleInfo}>
                  <h3 className={classes.moduleTitle}>Veri Yönetimi</h3>
                  <p className={classes.moduleDescription}>Güvenli ve ölçeklenebilir altyapı</p>
                </div>
              </div>
              
              <div className={classes.moduleItem}>
                <IconShield size={24} className={classes.moduleIcon} />
                <div className={classes.moduleInfo}>
                  <h3 className={classes.moduleTitle}>Güvenlik</h3>
                  <p className={classes.moduleDescription}>Enterprise seviye güvenlik özellikleri</p>
                </div>
              </div>
              
              <div className={classes.moduleItem}>
                <IconReport size={24} className={classes.moduleIcon} />
                <div className={classes.moduleInfo}>
                  <h3 className={classes.moduleTitle}>Raporlama</h3>
                  <p className={classes.moduleDescription}>Detaylı analiz ve raporlama araçları</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={classes.rightSection}>
        <Container size="xs" {...(classes.container ? { className: classes.container } : {})}>
          <Paper {...(classes.paper ? { className: classes.paper } : {})} p="xl" radius="md" withBorder>
            <Stack gap="lg">
              <div className={classes.header}>
                {logoUrl ? (
                  <NextImage
                    src={logoUrl}
                    alt="Logo"
                    width={120}
                    height={40}
                    className={classes.logo}
                  />
                ) : (
                  <Title order={2} ta="center" fw={700}>
                    {t('login.title')}
                  </Title>
                )}
                <Text c="dimmed" size="sm" ta="center" mt="xs">
                  Süper Admin Girişi
                </Text>
              </div>

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Hata"
                  color="red"
                  variant="light"
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <Select
                    label={t('labels.firma.secin')}
                    placeholder={t('labels.firma.secin')}
                    leftSection={<IconBuilding size={16} />}
                    data={tenants.map(t => ({ value: t.id, label: t.name }))}
                    value={form.values.tenantId}
                    onChange={(value) => form.setFieldValue('tenantId', value || '')}
                    required
                    disabled={loadingTenants}
                    searchable
                  />

                  <Select
                    label={t('labels.donem.secin.opsiyonel')}
                    placeholder={t('labels.donem.secin')}
                    leftSection={<IconCalendar size={16} />}
                    data={periods.map(p => ({ value: p.id, label: p.name }))}
                    value={form.values.periodId}
                    onChange={(value) => form.setFieldValue('periodId', value || '')}
                    disabled={loadingPeriods || !form.values.tenantId}
                    clearable
                  />

                  <TextInput
                    label={t('login.username')}
                    placeholder={t('login.usernamePlaceholder')}
                    leftSection={<IconUser size={16} />}
                    required
                    {...form.getInputProps('username')}
                  />

                  <PasswordInput
                    label={t('login.password')}
                    placeholder={t('login.passwordPlaceholder')}
                    leftSection={<IconLock size={16} />}
                    required
                    {...form.getInputProps('password')}
                  />

                  <Group justify="space-between">
                    <Checkbox
                      label={t('login.rememberMe')}
                      {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                    />
                    <Text size="sm" c="dimmed" component={Link} href={`/${locale}/forgot-password`}>
                      {t('login.forgotPassword')}
                    </Text>
                  </Group>

                  <Button
                    type="submit"
                    fullWidth
                    size="md"
                    loading={loading}
                    mt="md"
                  >
                    {t('login.submit')}
                  </Button>
                </Stack>
              </form>

              <Text size="sm" ta="center" c="dimmed">
                Normal kullanıcı girişi için{' '}
                <Text
                  component={Link}
                  href={`/${locale}/auth/login`}
                  c="blue"
                  fw={500}
                  td="underline"
                >
                  buraya tıklayın
                </Text>
              </Text>
            </Stack>
          </Paper>
        </Container>
      </div>
    </div>
  );
}

