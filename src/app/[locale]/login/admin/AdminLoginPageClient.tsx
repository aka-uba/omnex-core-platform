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
import { IconAlertCircle, IconUser, IconLock, IconCalendar, IconApps, IconDashboard, IconDatabase, IconShield, IconUsers, IconReport } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import Link from 'next/link';
import classes from './AdminLoginPage.module.css';
import NextImage from 'next/image';

const REMEMBER_ME_KEY = 'omnex-remember-credentials-admin';

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export function AdminLoginPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showPeriodSelection, setShowPeriodSelection] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      rememberMe: false,
      periodId: '',
    },
    validate: {
      username: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Kullanıcı adı gereklidir';
        }
        return null;
      },
      password: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Şifre gereklidir';
        }
        return null;
      },
    },
  });

  // Fetch periods when period selection is shown
  useEffect(() => {
    if (showPeriodSelection) {
      setLoadingPeriods(true);
      const fetchPeriods = async () => {
        try {
          // Get tenant from current context or cookie
          const tenantSlug = document.cookie
            .split('; ')
            .find(row => row.startsWith('tenant-slug='))
            ?.split('=')[1];

          if (tenantSlug) {
            const response = await fetch(`/api/tenants/${tenantSlug}/periods`);
            const data = await response.json();
            if (data.success && data.data?.periods) {
              setPeriods(data.data.periods);
            } else {
              // Default periods for last 3 years
              const currentYear = new Date().getFullYear();
              setPeriods([
                { id: `${currentYear}`, name: `${currentYear} Yılı`, startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` },
                { id: `${currentYear - 1}`, name: `${currentYear - 1} Yılı`, startDate: `${currentYear - 1}-01-01`, endDate: `${currentYear - 1}-12-31` },
                { id: `${currentYear - 2}`, name: `${currentYear - 2} Yılı`, startDate: `${currentYear - 2}-01-01`, endDate: `${currentYear - 2}-12-31` },
              ]);
            }
          } else {
            // Default periods for last 3 years
            const currentYear = new Date().getFullYear();
            setPeriods([
              { id: `${currentYear}`, name: `${currentYear} Yılı`, startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` },
              { id: `${currentYear - 1}`, name: `${currentYear - 1} Yılı`, startDate: `${currentYear - 1}-01-01`, endDate: `${currentYear - 1}-12-31` },
              { id: `${currentYear - 2}`, name: `${currentYear - 2} Yılı`, startDate: `${currentYear - 2}-01-01`, endDate: `${currentYear - 2}-12-31` },
            ]);
          }
        } catch (err) {
          // Default periods for last 3 years
          const currentYear = new Date().getFullYear();
          setPeriods([
            { id: `${currentYear}`, name: `${currentYear} Yılı`, startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` },
            { id: `${currentYear - 1}`, name: `${currentYear - 1} Yılı`, startDate: `${currentYear - 1}-01-01`, endDate: `${currentYear - 1}-12-31` },
            { id: `${currentYear - 2}`, name: `${currentYear - 2} Yılı`, startDate: `${currentYear - 2}-01-01`, endDate: `${currentYear - 2}-12-31` },
          ]);
        } finally {
          setLoadingPeriods(false);
        }
      };

      fetchPeriods();
    }
  }, [showPeriodSelection]);

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

  // Sayfa yüklendiğinde kaydedilmiş credentials'ı yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(REMEMBER_ME_KEY);
        if (saved) {
          const { username, password } = JSON.parse(saved);
          form.setValues({
            ...form.values,
            username: username || '',
            password: password || '',
            rememberMe: true,
          });
        }
      } catch (e) {
        // localStorage erişim hatası - sessizce devam et
      }
    }
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          periodId: values.periodId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Başarılı giriş - session'a kaydet
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.data.user));
          if (values.periodId) {
            const selectedPeriod = periods.find(p => p.id === values.periodId);
            localStorage.setItem('selectedPeriod', JSON.stringify(selectedPeriod));
          }

          // Beni Hatırla - credentials'ı kaydet veya sil
          if (values.rememberMe) {
            localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
              username: values.username,
              password: values.password,
            }));
          } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
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
              src="/branding/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className={classes.logoImage}
            />
            <h1 className={classes.platformTitle}>SaaS Platform</h1>
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
        <Container size="xs" className={classes.container}>
          <Paper className={classes.paper} p="xl" radius="md" withBorder>
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
                  {t('login.subtitle')}
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
                  <Button
                    variant="subtle"
                    fullWidth
                    onClick={() => setShowPeriodSelection(!showPeriodSelection)}
                    leftSection={<IconCalendar size={16} />}
                  >
                    {showPeriodSelection ? 'Dönem Seçimini Gizle' : 'Dönem Seç (Opsiyonel)'}
                  </Button>

                  {showPeriodSelection && (
                    <Select
                      label="Dönem Seçin (Opsiyonel)"
                      placeholder="Dönem seçin..."
                      leftSection={<IconCalendar size={16} />}
                      data={periods.map(p => ({ value: p.id, label: p.name }))}
                      value={form.values.periodId}
                      onChange={(value) => form.setFieldValue('periodId', value || '')}
                      disabled={loadingPeriods}
                      clearable
                    />
                  )}

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

              <Group justify="center" gap="xs">
                <Text size="sm" ta="center" c="dimmed">
                  {t('login.noAccount')}{' '}
                </Text>
                <Text
                  component={Link}
                  href={`/${locale}/register`}
                  c="blue"
                  fw={500}
                  td="underline"
                  size="sm"
                >
                  {t('login.register')}
                </Text>
              </Group>

              <Text size="sm" ta="center" c="dimmed">
                Süper admin girişi için{' '}
                <Text
                  component={Link}
                  href={`/${locale}/login/super-admin`}
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

