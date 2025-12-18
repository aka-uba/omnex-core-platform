'use client';

import { useState, useEffect } from 'react';
import { Paper, Stack, Title, Text, Badge, Group, Code, Alert, Button, Table, Progress } from '@mantine/core';
import { IconCheck, IconX, IconRefresh, IconDatabase, IconServer, IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

interface SystemStatus {
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    memory: {
      total: number;
      used: number;
      external: number;
    };
    environment: string;
  };
  databases: Array<{
    name: string;
    status: 'connected' | 'error';
    url?: string;
    info?: {
      user: string;
      host: string;
      port: string;
      database: string;
    };
    tables?: number;
    tenants?: number;
    isEmpty?: boolean; // Tables exist but no data
    error?: string;
  }>;
  postgresVersion: string;
  environment: Record<string, string | undefined>;
  timestamp: string;
}

export function SystemStatus() {
  const { t } = useTranslation('global');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/setup/system-status');
      const result = await response.json();
      if (result.success) {
        setStatus(result);
      } else {
        setError(result.error || t('setup.errors.unknown'));
      }
    } catch (err: any) {
        setError(err.message || t('setup.errors.statusFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}g ${hours}s`;
    if (hours > 0) return `${hours}s ${minutes}dk`;
    return `${minutes}dk`;
  };

  if (loading) {
    return (
      <Paper p="xl" shadow="sm" radius="md">
        <Progress value={100} animated />
        <Text ta="center" mt="md">{t('systemStatus.loading')}</Text>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="xl" shadow="sm" radius="md">
        <Alert icon={<IconX size={18} className="tabler-icon tabler-icon-x" />} title={t('actions.error')} color="red" mb="md">
          {error}
        </Alert>
        <Button onClick={fetchStatus} leftSection={<IconRefresh size={18} className="tabler-icon tabler-icon-refresh" />}>
          {t('systemStatus.retry')}
        </Button>
      </Paper>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Stack gap="md">
      {/* System Information */}
      <Paper p="md" withBorder>
        <Group mb="md">
          <IconServer size={20} className="tabler-icon tabler-icon-server" />
          <Title order={3}>{t('systemStatus.title')}</Title>
        </Group>
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td><strong>{t('systemStatus.fields.nodeVersion')}</strong></Table.Td>
              <Table.Td><Code>{status.system.nodeVersion}</Code></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><strong>{t('systemStatus.fields.platform')}</strong></Table.Td>
              <Table.Td><Code>{status.system.platform}</Code></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><strong>{t('systemStatus.fields.arch')}</strong></Table.Td>
              <Table.Td><Code>{status.system.arch}</Code></Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><strong>{t('systemStatus.fields.uptime')}</strong></Table.Td>
              <Table.Td>{formatUptime(status.system.uptime)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><strong>{t('systemStatus.fields.environment')}</strong></Table.Td>
              <Table.Td>
                <Badge color={status.system.environment === 'production' ? 'red' : 'blue'}>
                  {status.system.environment}
                </Badge>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td><strong>{t('systemStatus.fields.memoryUsage')}</strong></Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Text>{t('systemStatus.fields.used')} {status.system.memory.used} MB</Text>
                  <Text c="dimmed">/</Text>
                  <Text>{t('systemStatus.fields.total')} {status.system.memory.total} MB</Text>
                </Group>
                <Progress 
                  value={(status.system.memory.used / status.system.memory.total) * 100} 
                  mt="xs"
                  color={status.system.memory.used / status.system.memory.total > 0.8 ? 'red' : 'blue'}
                />
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Database Status */}
      <Paper p="md" withBorder>
        <Group mb="md" justify="space-between">
          <Group>
            <IconDatabase size={20} className="tabler-icon tabler-icon-database" />
            <Title order={3}>{t('systemStatus.databaseStatus')}</Title>
          </Group>
          <Button 
            variant="subtle" 
            leftSection={<IconRefresh size={16} className="tabler-icon tabler-icon-refresh" />}
            onClick={fetchStatus}
          >
            {t('systemStatus.refresh')}
          </Button>
        </Group>
        <Stack gap="md">
          {status.databases.map((db, index) => (
            <Paper key={index} p="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Group>
                  <Text fw={600}>{db.name}</Text>
                  {db.status === 'connected' ? (
                    <Badge color="green" leftSection={<IconCheck size={14} className="tabler-icon tabler-icon-check" />}>
                      {t('systemStatus.status.connected')}
                    </Badge>
                  ) : (
                    <Badge color="red" leftSection={<IconX size={14} className="tabler-icon tabler-icon-x" />}>
                      {t('systemStatus.status.error')}
                    </Badge>
                  )}
                </Group>
              </Group>
              {db.info && (
                <Table mb="sm">
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td><strong>{t('systemStatus.fields.host')}</strong></Table.Td>
                      <Table.Td><Code>{db.info.host}:{db.info.port}</Code></Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td><strong>{t('systemStatus.fields.user')}</strong></Table.Td>
                      <Table.Td><Code>{db.info.user}</Code></Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td><strong>{t('systemStatus.fields.database')}</strong></Table.Td>
                      <Table.Td><Code>{db.info.database}</Code></Table.Td>
                    </Table.Tr>
                    {db.tables !== undefined && (
                      <Table.Tr>
                        <Table.Td><strong>{t('systemStatus.fields.tableCount')}</strong></Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Badge>{db.tables}</Badge>
                            {db.isEmpty && (
                              <Badge color="orange" variant="light">
                                {t('systemStatus.fields.empty')}
                              </Badge>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    )}
                    {db.tenants !== undefined && (
                      <Table.Tr>
                        <Table.Td><strong>{t('systemStatus.fields.tenantCount')}</strong></Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Badge color="blue">{db.tenants}</Badge>
                            {db.tenants === 0 && db.tables && db.tables > 0 && (
                              <Badge color="orange" variant="light">
                                {t('systemStatus.fields.coreSeedRequired')}
                              </Badge>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              )}
              {db.url && (
                <Code block mt="xs" style={{ fontSize: '0.75rem' }}>
                  {db.url}
                </Code>
              )}
              {db.error && (
                <Alert icon={<IconX size={18} className="tabler-icon tabler-icon-x" />} title={t('actions.error')} color="red" mt="sm">
                  {db.error}
                </Alert>
              )}
            </Paper>
          ))}
        </Stack>
        {status.postgresVersion && status.postgresVersion !== 'Unknown' && (
          <Alert icon={<IconInfoCircle size={18} className="tabler-icon tabler-icon-info-circle" />} color="blue" mt="md">
            <Text><strong>{t('systemStatus.fields.postgresVersion')}</strong> {status.postgresVersion}</Text>
          </Alert>
        )}
      </Paper>

      {/* Environment Variables */}
      <Paper p="md" withBorder>
        <Group mb="md">
          <IconInfoCircle size={20} className="tabler-icon tabler-icon-info-circle" />
          <Title order={3}>{t('systemStatus.environmentVariables')}</Title>
        </Group>
        <Table>
          <Table.Tbody>
            {Object.entries(status.environment).map(([key, value]) => (
              <Table.Tr key={key}>
                <Table.Td><strong>{key}</strong></Table.Td>
                <Table.Td>
                  {value ? (
                    <Badge color={value === 'true' ? 'green' : 'gray'}>{value}</Badge>
                  ) : (
                    <Text c="dimmed">{t('systemStatus.fields.notDefined')}</Text>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Timestamp */}
      <Text c="dimmed" ta="center">
        {t('systemStatus.lastUpdate')} {new Date(status.timestamp).toLocaleString('tr-TR')}
      </Text>
    </Stack>
  );
}


