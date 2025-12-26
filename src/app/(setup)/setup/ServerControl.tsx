'use client';

import { useState, useEffect } from 'react';
import { Paper, Stack, Title, Text, Badge, Group, Code, Alert, Button, Table, Progress, TextInput, SimpleGrid, Card, Loader } from '@mantine/core';
import { IconServer, IconRefresh, IconPlayerPlay, IconPlayerStop, IconTerminal, IconCheck, IconX, IconKey } from '@tabler/icons-react';

interface PM2Process {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
  pid: number;
}

interface CommandResult {
  success: boolean;
  command?: string;
  output?: string;
  stderr?: string;
  error?: string;
  timestamp?: string;
}

const COMMANDS = [
  { id: 'pm2-status', label: 'PM2 Durumu', icon: IconServer, color: 'blue' },
  { id: 'pm2-restart', label: 'PM2 Restart', icon: IconRefresh, color: 'orange' },
  { id: 'pm2-logs', label: 'PM2 Logları', icon: IconTerminal, color: 'gray' },
  { id: 'system-info', label: 'Sistem Bilgisi', icon: IconServer, color: 'cyan' },
  { id: 'prisma-generate', label: 'Prisma Generate', icon: IconRefresh, color: 'violet' },
  { id: 'clear-cache', label: 'Cache Temizle', icon: IconX, color: 'red' },
  { id: 'node-version', label: 'Node Versiyonu', icon: IconCheck, color: 'green' },
];

export function ServerControl() {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [pm2Status, setPm2Status] = useState<PM2Process[] | null>(null);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('server-admin-token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const saveToken = () => {
    localStorage.setItem('server-admin-token', token);
    setIsAuthenticated(true);
    setError(null);
  };

  const executeCommand = async (commandId: string) => {
    if (!token) {
      setError('Admin token gerekli');
      return;
    }

    setLoading(commandId);
    setError(null);
    setLastResult(null);

    try {
      const response = await fetch('/api/setup/server-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ command: commandId }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem('server-admin-token');
        }
        setError(result.error || 'Komut çalıştırılamadı');
        return;
      }

      setLastResult(result);

      // Parse PM2 status
      if (commandId === 'pm2-status' && result.output) {
        try {
          const processes = JSON.parse(result.output);
          setPm2Status(processes);
        } catch {
          // Keep as text output
        }
      }
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası');
    } finally {
      setLoading(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}g ${hours}s`;
    if (hours > 0) return `${hours}s ${minutes}dk`;
    return `${minutes}dk ${seconds % 60}sn`;
  };

  if (!isAuthenticated) {
    return (
      <Paper p="xl" withBorder>
        <Stack gap="md">
          <Group>
            <IconKey size={24} />
            <Title order={3}>Sunucu Yönetimi - Kimlik Doğrulama</Title>
          </Group>
          <Text c="dimmed">
            Sunucu komutlarını çalıştırmak için admin token gereklidir.
            Token, sunucunun .env dosyasında SERVER_ADMIN_TOKEN olarak tanımlanmalıdır.
          </Text>
          <TextInput
            label="Admin Token"
            placeholder="omnex-admin-2025"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            type="password"
          />
          {error && (
            <Alert color="red" icon={<IconX size={18} />}>
              {error}
            </Alert>
          )}
          <Button onClick={saveToken} disabled={!token}>
            Giriş Yap
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* PM2 Status Card */}
      {pm2Status && (
        <Paper p="md" withBorder>
          <Group mb="md" justify="space-between">
            <Group>
              <IconServer size={20} />
              <Title order={4}>PM2 Süreçleri</Title>
            </Group>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={() => executeCommand('pm2-status')}
              loading={loading === 'pm2-status'}
            >
              Yenile
            </Button>
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>İsim</Table.Th>
                <Table.Th>Durum</Table.Th>
                <Table.Th>CPU</Table.Th>
                <Table.Th>RAM</Table.Th>
                <Table.Th>Uptime</Table.Th>
                <Table.Th>Restart</Table.Th>
                <Table.Th>PID</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pm2Status.map((proc) => (
                <Table.Tr key={proc.name}>
                  <Table.Td><Text fw={600}>{proc.name}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={proc.status === 'online' ? 'green' : 'red'}>
                      {proc.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{proc.cpu}%</Table.Td>
                  <Table.Td>{proc.memory} MB</Table.Td>
                  <Table.Td>{formatUptime(proc.uptime)}</Table.Td>
                  <Table.Td>{proc.restarts}</Table.Td>
                  <Table.Td><Code>{proc.pid}</Code></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* Command Buttons */}
      <Paper p="md" withBorder>
        <Group mb="md">
          <IconTerminal size={20} />
          <Title order={4}>Sunucu Komutları</Title>
        </Group>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {COMMANDS.map((cmd) => (
            <Button
              key={cmd.id}
              variant="light"
              color={cmd.color}
              leftSection={loading === cmd.id ? <Loader size={16} /> : <cmd.icon size={16} />}
              onClick={() => executeCommand(cmd.id)}
              disabled={loading !== null}
              fullWidth
            >
              {cmd.label}
            </Button>
          ))}
        </SimpleGrid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert color="red" icon={<IconX size={18} />} withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Command Output */}
      {lastResult && (
        <Paper p="md" withBorder>
          <Group mb="md" justify="space-between">
            <Group>
              <IconTerminal size={20} />
              <Title order={4}>Komut Çıktısı</Title>
            </Group>
            <Group>
              <Badge color={lastResult.success ? 'green' : 'red'}>
                {lastResult.success ? 'Başarılı' : 'Hata'}
              </Badge>
              {lastResult.command && (
                <Badge variant="light">{lastResult.command}</Badge>
              )}
            </Group>
          </Group>
          {lastResult.output && (
            <Code block style={{ maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {lastResult.output}
            </Code>
          )}
          {lastResult.stderr && (
            <Alert color="yellow" mt="sm" title="stderr">
              <Code block>{lastResult.stderr}</Code>
            </Alert>
          )}
          {lastResult.error && (
            <Alert color="red" mt="sm">
              {lastResult.error}
            </Alert>
          )}
          {lastResult.timestamp && (
            <Text c="dimmed" size="xs" mt="sm">
              {new Date(lastResult.timestamp).toLocaleString('tr-TR')}
            </Text>
          )}
        </Paper>
      )}

      {/* Token Info */}
      <Paper p="sm" withBorder>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Admin token ile giriş yapıldı
          </Text>
          <Button
            variant="subtle"
            color="red"
            size="xs"
            onClick={() => {
              localStorage.removeItem('server-admin-token');
              setIsAuthenticated(false);
              setToken('');
              setPm2Status(null);
              setLastResult(null);
            }}
          >
            Çıkış Yap
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
