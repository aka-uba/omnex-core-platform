'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Button,
  Group,
  Alert,
  Badge,
  Stack,
  Title,
  Text,
  Card,
  Box,
  Loader,
  ThemeIcon,
  Progress,
  Code,
  Divider,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconShieldCheck,
  IconShieldExclamation,
  IconPackage,
  IconBrandReact,
  IconBrandNextjs,
  IconLock,
  IconBug,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  details?: string;
  fixCommand?: string;
}

interface SecuritySummary {
  total: number;
  pass: number;
  warning: number;
  fail: number;
  overallStatus: 'pass' | 'warning' | 'fail';
}

interface PackageVersions {
  next: string;
  react: string;
  reactDom: string;
  typescript: string;
  prisma: string;
}

interface SecurityAuditData {
  checks: SecurityCheck[];
  summary: SecuritySummary;
  versions: PackageVersions;
  lastChecked: string;
}

export function SecurityAudit() {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [auditData, setAuditData] = useState<SecurityAuditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSecurityAudit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/security-audit?action=summary');
      const result = await response.json();

      if (result.success) {
        setAuditData(result.data);
      } else {
        setError(result.error || 'Güvenlik taraması başarısız');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, []);

  const runAuditFix = async () => {
    setFixing(true);

    try {
      const response = await fetch('/api/setup/security-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix' }),
      });
      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Başarılı',
          message: 'Güvenlik düzeltmeleri uygulandı',
        });
        // Re-run audit to refresh status
        await runSecurityAudit();
      } else {
        showToast({
          type: 'error',
          title: 'Hata',
          message: result.error || 'Düzeltme başarısız',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Hata',
        message: err instanceof Error ? err.message : 'Bağlantı hatası',
      });
    } finally {
      setFixing(false);
    }
  };

  const updateSecurityPackages = async () => {
    setFixing(true);

    try {
      const response = await fetch('/api/setup/security-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-security' }),
      });
      const result = await response.json();

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Başarılı',
          message: 'Güvenlik güncellemeleri uygulandı. Build yapmanız gerekiyor.',
        });
        await runSecurityAudit();
      } else {
        showToast({
          type: 'error',
          title: 'Hata',
          message: result.error || 'Güncelleme başarısız',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Hata',
        message: err instanceof Error ? err.message : 'Bağlantı hatası',
      });
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    runSecurityAudit();
  }, [runSecurityAudit]);

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <IconCheck size={18} style={{ color: 'var(--mantine-color-green-6)' }} />;
      case 'fail':
        return <IconX size={18} style={{ color: 'var(--mantine-color-red-6)' }} />;
      case 'warning':
        return <IconAlertCircle size={18} style={{ color: 'var(--mantine-color-yellow-6)' }} />;
      default:
        return <IconRefresh size={18} style={{ color: 'var(--mantine-color-gray-6)' }} />;
    }
  };

  const getStatusColor = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return 'green';
      case 'fail':
        return 'red';
      case 'warning':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'green';
      case 'fail':
        return 'red';
      case 'warning':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getCheckIcon = (checkId: string) => {
    switch (checkId) {
      case 'nextjs-version':
        return <IconBrandNextjs size={20} />;
      case 'react-version':
        return <IconBrandReact size={20} />;
      case 'npm-audit':
        return <IconBug size={20} />;
      case 'env-security':
        return <IconLock size={20} />;
      case 'typescript-strict':
        return <IconPackage size={20} />;
      default:
        return <IconShieldCheck size={20} />;
    }
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <Paper p="lg" withBorder radius="md">
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon
              size="xl"
              variant="light"
              color={auditData?.summary.overallStatus === 'pass' ? 'green' : auditData?.summary.overallStatus === 'fail' ? 'red' : 'yellow'}
            >
              {auditData?.summary.overallStatus === 'pass' ? (
                <IconShieldCheck size={28} />
              ) : (
                <IconShieldExclamation size={28} />
              )}
            </ThemeIcon>
            <div>
              <Title order={3}>Güvenlik Durumu</Title>
              <Text c="dimmed" size="sm">
                Son kontrol: {auditData?.lastChecked ? new Date(auditData.lastChecked).toLocaleString('tr-TR') : 'Henüz kontrol edilmedi'}
              </Text>
            </div>
          </Group>
          <Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={runSecurityAudit}
              loading={loading}
            >
              Yeniden Tara
            </Button>
          </Group>
        </Group>

        {/* Summary Cards */}
        {auditData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <Card withBorder radius="md" p="md">
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                Toplam Kontrol
              </Text>
              <Text size="xl" fw={700}>
                {auditData.summary.total}
              </Text>
            </Card>
            <Card withBorder radius="md" p="md" style={{ borderColor: 'var(--mantine-color-green-5)' }}>
              <Text c="green" size="xs" tt="uppercase" fw={700}>
                Başarılı
              </Text>
              <Text size="xl" fw={700} c="green">
                {auditData.summary.pass}
              </Text>
            </Card>
            <Card withBorder radius="md" p="md" style={{ borderColor: 'var(--mantine-color-yellow-5)' }}>
              <Text c="yellow" size="xs" tt="uppercase" fw={700}>
                Uyarı
              </Text>
              <Text size="xl" fw={700} c="yellow">
                {auditData.summary.warning}
              </Text>
            </Card>
            <Card withBorder radius="md" p="md" style={{ borderColor: 'var(--mantine-color-red-5)' }}>
              <Text c="red" size="xs" tt="uppercase" fw={700}>
                Kritik
              </Text>
              <Text size="xl" fw={700} c="red">
                {auditData.summary.fail}
              </Text>
            </Card>
          </div>
        )}
      </Paper>

      {/* Loading State */}
      {loading && !auditData && (
        <Paper p="xl" withBorder radius="md">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Güvenlik taraması yapılıyor...</Text>
          </Stack>
        </Paper>
      )}

      {/* Error State */}
      {error && (
        <Alert icon={<IconAlertCircle size={18} />} title="Hata" color="red">
          {error}
        </Alert>
      )}

      {/* Package Versions */}
      {auditData?.versions && (
        <Paper p="lg" withBorder radius="md">
          <Group mb="md">
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconPackage size={20} />
            </ThemeIcon>
            <Title order={4}>Paket Sürümleri</Title>
          </Group>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            <Card withBorder radius="md" p="sm">
              <Group gap="xs" mb="xs">
                <IconBrandNextjs size={16} />
                <Text size="sm" fw={600}>Next.js</Text>
              </Group>
              <Code>{auditData.versions.next}</Code>
            </Card>
            <Card withBorder radius="md" p="sm">
              <Group gap="xs" mb="xs">
                <IconBrandReact size={16} />
                <Text size="sm" fw={600}>React</Text>
              </Group>
              <Code>{auditData.versions.react}</Code>
            </Card>
            <Card withBorder radius="md" p="sm">
              <Group gap="xs" mb="xs">
                <IconBrandReact size={16} />
                <Text size="sm" fw={600}>React-DOM</Text>
              </Group>
              <Code>{auditData.versions.reactDom}</Code>
            </Card>
            <Card withBorder radius="md" p="sm">
              <Group gap="xs" mb="xs">
                <IconPackage size={16} />
                <Text size="sm" fw={600}>TypeScript</Text>
              </Group>
              <Code>{auditData.versions.typescript}</Code>
            </Card>
            <Card withBorder radius="md" p="sm">
              <Group gap="xs" mb="xs">
                <IconPackage size={16} />
                <Text size="sm" fw={600}>Prisma</Text>
              </Group>
              <Code>{auditData.versions.prisma}</Code>
            </Card>
          </div>
        </Paper>
      )}

      {/* Security Checks */}
      {auditData?.checks && (
        <Paper p="lg" withBorder radius="md">
          <Group mb="md" justify="space-between">
            <Group>
              <ThemeIcon size="lg" variant="light" color="violet">
                <IconShieldCheck size={20} />
              </ThemeIcon>
              <Title order={4}>Güvenlik Kontrolleri</Title>
            </Group>
            {auditData.summary.fail > 0 && (
              <Button
                variant="filled"
                color="red"
                leftSection={<IconShieldExclamation size={16} />}
                onClick={updateSecurityPackages}
                loading={fixing}
              >
                Kritik Güncellemeleri Uygula
              </Button>
            )}
          </Group>

          <Stack gap="sm">
            {auditData.checks.map((check) => (
              <Paper
                key={check.id}
                p="md"
                withBorder
                radius="md"
                style={{
                  borderColor: `var(--mantine-color-${getStatusColor(check.status)}-5)`,
                  backgroundColor: check.status === 'fail' ? 'var(--mantine-color-red-0)' : undefined,
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap">
                    <ThemeIcon size="lg" variant="light" color={getStatusColor(check.status)}>
                      {getCheckIcon(check.id)}
                    </ThemeIcon>
                    <div>
                      <Group gap="xs">
                        <Text fw={600}>{check.name}</Text>
                        <Badge size="sm" color={getStatusColor(check.status)} variant="light">
                          {check.status === 'pass' ? 'Güvenli' : check.status === 'fail' ? 'Kritik' : 'Uyarı'}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {check.description}
                      </Text>
                      {check.details && (
                        <Text size="sm" mt="xs">
                          {check.details}
                        </Text>
                      )}
                    </div>
                  </Group>
                  <Group>
                    {getStatusIcon(check.status)}
                    {check.fixCommand && (
                      <Tooltip label={check.fixCommand} multiline w={300}>
                        <Badge variant="outline" color="blue" style={{ cursor: 'help' }}>
                          Düzeltme mevcut
                        </Badge>
                      </Tooltip>
                    )}
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Quick Actions */}
      <Paper p="lg" withBorder radius="md">
        <Group mb="md">
          <ThemeIcon size="lg" variant="light" color="teal">
            <IconRefresh size={20} />
          </ThemeIcon>
          <Title order={4}>Hızlı İşlemler</Title>
        </Group>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <Button
            variant="light"
            color="blue"
            leftSection={<IconBug size={16} />}
            onClick={runAuditFix}
            loading={fixing}
            fullWidth
          >
            npm audit fix
          </Button>
          <Button
            variant="light"
            color="violet"
            leftSection={<IconPackage size={16} />}
            onClick={updateSecurityPackages}
            loading={fixing}
            fullWidth
          >
            Güvenlik Paketlerini Güncelle
          </Button>
          <Button
            variant="light"
            color="green"
            leftSection={<IconRefresh size={16} />}
            onClick={runSecurityAudit}
            loading={loading}
            fullWidth
          >
            Tekrar Tara
          </Button>
        </div>

        <Divider my="md" label="Manuel Komutlar" labelPosition="center" />

        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
          <Text size="sm" mb="xs">
            Terminal üzerinden güvenlik kontrolü için:
          </Text>
          <Code block>
            {`# Güvenlik taraması
npm audit

# Otomatik düzeltme
npm audit fix

# Güncel olmayan paketler
npm outdated

# GitHub güvenlik raporu (gh CLI gerekli)
./scripts/fetch-security-reports.sh`}
          </Code>
        </Alert>
      </Paper>

      {/* CVE Information */}
      <Paper p="lg" withBorder radius="md">
        <Group mb="md">
          <ThemeIcon size="lg" variant="light" color="orange">
            <IconAlertCircle size={20} />
          </ThemeIcon>
          <Title order={4}>Bilinen Güvenlik Açıkları (CVE)</Title>
        </Group>

        <Alert icon={<IconShieldExclamation size={16} />} color="orange" variant="light" mb="md">
          <Text size="sm" fw={600} mb="xs">
            CVE-2025-55182 (React2Shell) - CVSS 10.0 KRİTİK
          </Text>
          <Text size="sm">
            React Server Components&apos;ta güvenli olmayan deserializasyon açığı. Uzaktan kod çalıştırma (RCE) riski.
          </Text>
          <Text size="sm" mt="xs">
            <strong>Güvenli Sürümler:</strong> Next.js 16.0.10+, React 19.2.3+
          </Text>
        </Alert>

        <Text size="sm" c="dimmed">
          Daha fazla bilgi için:{' '}
          <a href="https://nvd.nist.gov/vuln" target="_blank" rel="noopener noreferrer">
            NVD - National Vulnerability Database
          </a>
        </Text>
      </Paper>
    </Stack>
  );
}
