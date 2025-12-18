'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Badge,
  Button,
  Tabs,
  Table,
  Alert,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Code,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconRefresh,
  IconExternalLink,
  IconArrowRight,
  IconCopy,
} from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { PageAnalysisPageSkeleton } from './PageAnalysisPageSkeleton';

interface PageInfo {
  id: string;
  label: string;
  href: string;
  fullPath: string;
  relativePath: string;
  category: 'core' | 'module' | 'settings' | 'admin' | 'other';
  moduleSlug?: string;
  hasRedirect: boolean;
  redirectTarget?: string;
  isDynamic: boolean;
  dynamicParams?: string[];
  description?: string;
  conflicts?: string[];
  duplicateOf?: string;
}

interface PageCategory {
  id: string;
  label: string;
  icon: string;
  pages: PageInfo[];
  conflicts: number;
  duplicates: number;
}

interface AnalysisData {
  categories: PageCategory[];
  allPages: PageInfo[];
  stats: {
    total: number;
    withRedirects: number;
    dynamic: number;
    conflicts: number;
    duplicates: number;
    byCategory: Record<string, number>;
  };
  conflicts: Array<{
    href: string;
    pages: PageInfo[];
  }>;
  duplicates: Array<{
    label: string;
    pages: PageInfo[];
  }>;
}

export default function PageAnalysisPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menu-management/comprehensive-pages');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          showToast({
            type: 'error',
            title: 'Hata',
            message: result.error || 'Veri yüklenemedi',
          });
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast({
        type: 'error',
        title: 'Hata',
        message: 'Sayfa analizi yüklenemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Kopyalandı',
      message: 'Panoya kopyalandı',
    });
  };

  const openPage = (href: string) => {
    window.open(`/${locale}${href}`, '_blank');
  };

  if (loading) {
    return <PageAnalysisPageSkeleton />;
  }

  if (!data) {
    return (
      <Container py="xl">
        <Alert color="red" title="Hata">
          Veri yüklenemedi. Lütfen sayfayı yenileyin.
        </Alert>
      </Container>
    );
  }

  return (
    <Container py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} mb="xs">
              📊 Sayfa Analizi ve Menü Yönetimi
            </Title>
            <Text c="dimmed">
              Tüm sayfaların kapsamlı analizi, çakışmalar ve yönlendirmeler
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={loadData}
            loading={loading}
            variant="light"
          >
            Yenile
          </Button>
        </Group>

        {/* Stats */}
        <Paper p="md" withBorder>
          <Group gap="lg">
            <div>
              <Text c="dimmed" tt="uppercase" fw={700}>
                Toplam Sayfa
              </Text>
              <Text fw={700} c="blue">
                {data.stats.total}
              </Text>
            </div>
            <div>
              <Text c="dimmed" tt="uppercase" fw={700}>
                Yönlendirme
              </Text>
              <Text fw={700} c="orange">
                {data.stats.withRedirects}
              </Text>
            </div>
            <div>
              <Text c="dimmed" tt="uppercase" fw={700}>
                Çakışma
              </Text>
              <Text fw={700} c="red">
                {data.stats.conflicts}
              </Text>
            </div>
            <div>
              <Text c="dimmed" tt="uppercase" fw={700}>
                Tekrar
              </Text>
              <Text fw={700} c="yellow">
                {data.stats.duplicates}
              </Text>
            </div>
            <div>
              <Text c="dimmed" tt="uppercase" fw={700}>
                Dinamik Route
              </Text>
              <Text fw={700} c="violet">
                {data.stats.dynamic}
              </Text>
            </div>
          </Group>
        </Paper>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(v) => v && setActiveTab(v)}>
          <Tabs.List>
            <Tabs.Tab value="overview">Genel Bakış</Tabs.Tab>
            <Tabs.Tab value="categories">Kategoriler</Tabs.Tab>
            <Tabs.Tab value="conflicts">Çakışmalar</Tabs.Tab>
            <Tabs.Tab value="duplicates">Tekrarlar</Tabs.Tab>
            <Tabs.Tab value="redirects">Yönlendirmeler</Tabs.Tab>
            <Tabs.Tab value="all">Tüm Sayfalar</Tabs.Tab>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Panel value="overview" pt="lg">
            <Stack gap="md">
              {data.stats.conflicts > 0 && (
                <Alert color="red" icon={<IconAlertTriangle size={16} />} title="Çakışmalar Tespit Edildi">
                  {data.stats.conflicts} sayfa çakışması bulundu. Lütfen "Çakışmalar" sekmesini kontrol edin.
                </Alert>
              )}

              {data.stats.duplicates > 0 && (
                <Alert color="yellow" icon={<IconAlertTriangle size={16} />} title="Tekrarlar Tespit Edildi">
                  {data.stats.duplicates} tekrar eden sayfa bulundu. Lütfen "Tekrarlar" sekmesini kontrol edin.
                </Alert>
              )}

              <Paper p="md" withBorder>
                <Title order={4} mb="md">Kategori Dağılımı</Title>
                <Stack gap="xs">
                  {Object.entries(data.stats.byCategory).map(([category, count]) => {
                    const cat = data.categories.find(c => c.id === category);
                    return (
                      <Group key={category} justify="space-between">
                        <Text>{cat?.label || category}</Text>
                        <Badge>{count}</Badge>
                      </Group>
                    );
                  })}
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* Categories Tab */}
          <Tabs.Panel value="categories" pt="lg">
            <Stack gap="md">
              {data.categories.map((category) => (
                <Paper key={category.id} p="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={4}>{category.label}</Title>
                    <Group gap="xs">
                      <Badge>{category.pages.length} sayfa</Badge>
                      {category.conflicts > 0 && (
                        <Badge color="red">{category.conflicts} çakışma</Badge>
                      )}
                      {category.duplicates > 0 && (
                        <Badge color="yellow">{category.duplicates} tekrar</Badge>
                      )}
                    </Group>
                  </Group>
                  <ScrollArea h={400}>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Sayfa</Table.Th>
                          <Table.Th>URL</Table.Th>
                          <Table.Th>Durum</Table.Th>
                          <Table.Th>İşlemler</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {category.pages.map((page) => (
                          <Table.Tr key={page.id}>
                            <Table.Td>
                              <Group gap="xs">
                                <Text fw={500}>{page.label}</Text>
                                {page.isDynamic && (
                                  <Badge color="violet">Dinamik</Badge>
                                )}
                                {page.hasRedirect && (
                                  <Badge color="orange">Yönlendirme</Badge>
                                )}
                                {page.conflicts && page.conflicts.length > 0 && (
                                  <Badge color="red">Çakışma</Badge>
                                )}
                                {page.duplicateOf && (
                                  <Badge color="yellow">Tekrar</Badge>
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Code>{page.href}</Code>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                {page.hasRedirect ? (
                                  <Tooltip label={`Yönlendirme: ${page.redirectTarget}`}>
                                    <IconArrowRight size={16} color="orange" />
                                  </Tooltip>
                                ) : (
                                  <IconCheck size={16} color="green" />
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                {!page.hasRedirect && (
                                  <Tooltip label="Sayfayı Aç">
                                    <ActionIcon
                                      variant="light"
                                      onClick={() => openPage(page.href)}
                                    >
                                      <IconExternalLink size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                                <Tooltip label="URL'yi Kopyala">
                                  <ActionIcon
                                    variant="light"
                                    onClick={() => copyToClipboard(page.href)}
                                  >
                                    <IconCopy size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Paper>
              ))}
            </Stack>
          </Tabs.Panel>

          {/* Conflicts Tab */}
          <Tabs.Panel value="conflicts" pt="lg">
            <Stack gap="md">
              {data.conflicts.length === 0 ? (
                <Alert color="green" icon={<IconCheck size={16} />}>
                  Çakışma bulunamadı. Tüm sayfalar benzersiz URL'lere sahip.
                </Alert>
              ) : (
                data.conflicts.map((conflict, idx) => (
                  <Paper key={idx} p="md" withBorder style={{ borderLeft: '4px solid red' }}>
                    <Group justify="space-between" mb="md">
                      <Title order={4}>Çakışma: {conflict.href}</Title>
                      <Badge color="red">{conflict.pages.length} sayfa</Badge>
                    </Group>
                    <Stack gap="xs">
                      {conflict.pages.map((page) => (
                        <Group key={page.id} justify="space-between" p="xs" style={{ backgroundColor: '#fef2f2' }}>
                          <div>
                            <Text fw={500}>{page.label}</Text>
                            <Text c="dimmed">
                              {page.relativePath}
                            </Text>
                          </div>
                          <Group gap="xs">
                            <Badge>{page.category}</Badge>
                            {page.moduleSlug && <Badge color="blue">{page.moduleSlug}</Badge>}
                            <ActionIcon
                              variant="light"
                              onClick={() => copyToClipboard(page.fullPath)}
                            >
                              <IconCopy size={14} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </Tabs.Panel>

          {/* Duplicates Tab */}
          <Tabs.Panel value="duplicates" pt="lg">
            <Stack gap="md">
              {data.duplicates.length === 0 ? (
                <Alert color="green" icon={<IconCheck size={16} />}>
                  Tekrar eden sayfa bulunamadı.
                </Alert>
              ) : (
                data.duplicates.map((dup, idx) => (
                  <Paper key={idx} p="md" withBorder style={{ borderLeft: '4px solid yellow' }}>
                    <Group justify="space-between" mb="md">
                      <Title order={4}>Tekrar: {dup.label}</Title>
                      <Badge color="yellow">{dup.pages.length} sayfa</Badge>
                    </Group>
                    <Stack gap="xs">
                      {dup.pages.map((page) => (
                        <Group key={page.id} justify="space-between" p="xs" style={{ backgroundColor: '#fefce8' }}>
                          <div>
                            <Text fw={500}>{page.href}</Text>
                            <Text c="dimmed">
                              {page.relativePath}
                            </Text>
                          </div>
                          <Group gap="xs">
                            <Badge>{page.category}</Badge>
                            {page.moduleSlug && <Badge color="blue">{page.moduleSlug}</Badge>}
                            {!page.hasRedirect && (
                              <ActionIcon
                                variant="light"
                                onClick={() => openPage(page.href)}
                              >
                                <IconExternalLink size={14} />
                              </ActionIcon>
                            )}
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </Tabs.Panel>

          {/* Redirects Tab */}
          <Tabs.Panel value="redirects" pt="lg">
            <Stack gap="md">
              {data.stats.withRedirects === 0 ? (
                <Alert color="green" icon={<IconCheck size={16} />}>
                  Yönlendirme içeren sayfa bulunamadı.
                </Alert>
              ) : (
                <Paper p="md" withBorder>
                  <Title order={4} mb="md">
                    Yönlendirme İçeren Sayfalar ({data.stats.withRedirects})
                  </Title>
                  <ScrollArea h={500}>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Sayfa</Table.Th>
                          <Table.Th>Kaynak URL</Table.Th>
                          <Table.Th>Hedef URL</Table.Th>
                          <Table.Th>Yol</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {data.allPages
                          .filter((p) => p.hasRedirect)
                          .map((page) => (
                            <Table.Tr key={page.id}>
                              <Table.Td>
                                <Text fw={500}>{page.label}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Code>{page.href}</Code>
                              </Table.Td>
                              <Table.Td>
                                <Code>{page.redirectTarget || 'Bilinmiyor'}</Code>
                              </Table.Td>
                              <Table.Td>
                                <Text c="dimmed">
                                  {page.relativePath}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          {/* All Pages Tab */}
          <Tabs.Panel value="all" pt="lg">
            <Paper p="md" withBorder>
              <Title order={4} mb="md">
                Tüm Sayfalar ({data.allPages.length})
              </Title>
              <ScrollArea h={600}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Sayfa</Table.Th>
                      <Table.Th>URL</Table.Th>
                      <Table.Th>Kategori</Table.Th>
                      <Table.Th>Durum</Table.Th>
                      <Table.Th>İşlemler</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.allPages.map((page) => (
                      <Table.Tr key={page.id}>
                        <Table.Td>
                          <Text fw={500}>{page.label}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Code>{page.href}</Code>
                        </Table.Td>
                        <Table.Td>
                          <Badge>{page.category}</Badge>
                          {page.moduleSlug && (
                            <Badge color="blue" ml="xs">
                              {page.moduleSlug}
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {page.hasRedirect && (
                              <Tooltip label="Yönlendirme">
                                <IconArrowRight size={16} color="orange" />
                              </Tooltip>
                            )}
                            {page.isDynamic && (
                              <Tooltip label="Dinamik Route">
                                <Badge color="violet">D</Badge>
                              </Tooltip>
                            )}
                            {page.conflicts && page.conflicts.length > 0 && (
                              <Tooltip label="Çakışma">
                                <Badge color="red">Ç</Badge>
                              </Tooltip>
                            )}
                            {page.duplicateOf && (
                              <Tooltip label="Tekrar">
                                <Badge color="yellow">T</Badge>
                              </Tooltip>
                            )}
                            {!page.hasRedirect && !page.conflicts && !page.duplicateOf && (
                              <IconCheck size={16} color="green" />
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {!page.hasRedirect && (
                              <ActionIcon
                                variant="light"
                                onClick={() => openPage(page.href)}
                              >
                                <IconExternalLink size={16} />
                              </ActionIcon>
                            )}
                            <ActionIcon
                              variant="light"
                              onClick={() => copyToClipboard(page.href)}
                            >
                              <IconCopy size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}


