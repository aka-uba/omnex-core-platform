'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container, Title, Text, Paper, Stack, Group, Badge, Button, Collapse, ActionIcon, Loader } from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconFolder, IconFolderOpen, IconRefresh } from '@tabler/icons-react';

interface DirectoryNode {
  name: string;
  path: string;
  fullPath: string;
  hasPage: boolean;
  children: DirectoryNode[];
  level: number;
}

export default function DirectoryMenuTestPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const [structure, setStructure] = useState<DirectoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, withPages: 0, withoutPages: 0 });

  useEffect(() => {
    loadStructure();
  }, []);

  const loadStructure = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test/directory-structure');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStructure(data.data);
          calculateStats(data.data);
          // Expand first level by default
          const firstLevelPaths = new Set<string>();
          data.data.forEach((node: DirectoryNode) => {
            firstLevelPaths.add(node.path);
          });
          setExpandedPaths(firstLevelPaths);
        }
      }
    } catch (error) {
      console.error('Error loading structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (nodes: DirectoryNode[]) => {
    let total = 0;
    let withPages = 0;
    let withoutPages = 0;

    const traverse = (nodeList: DirectoryNode[]) => {
      nodeList.forEach(node => {
        total++;
        if (node.hasPage) {
          withPages++;
        } else {
          withoutPages++;
        }
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(nodes);
    setStats({ total, withPages, withoutPages });
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (nodes: DirectoryNode[]) => {
      nodes.forEach(node => {
        allPaths.add(node.path);
        if (node.children.length > 0) {
          collectPaths(node.children);
        }
      });
    };
    collectPaths(structure);
    setExpandedPaths(allPaths);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  const renderNode = (node: DirectoryNode): React.ReactElement => {
    const isExpanded = expandedPaths.has(node.path);
    const hasChildren = node.children.length > 0;
    const routePath = `/${locale}${node.path.replace(/^\[locale\]/, '')}`;

    return (
      <div key={node.path} style={{ marginLeft: `${node.level * 24}px` }}>
        <Paper
          p="sm"
          mb="xs"
          withBorder
          style={{
            backgroundColor: node.hasPage ? '#f0fdf4' : '#fef2f2',
            borderLeft: `4px solid ${node.hasPage ? '#10b981' : '#ef4444'}`,
            cursor: hasChildren ? 'pointer' : 'default',
          }}
          onClick={() => hasChildren && toggleExpand(node.path)}
        >
          <Group gap="xs" wrap="nowrap">
            {hasChildren ? (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.path);
                }}
              >
                {isExpanded ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRight size={16} />
                )}
              </ActionIcon>
            ) : (
              <div style={{ width: 24 }} />
            )}
            
            {isExpanded ? (
              <IconFolderOpen size={18} color="#3b82f6" />
            ) : (
              <IconFolder size={18} color="#64748b" />
            )}
            
            <Text fw={500} size="sm" style={{ flex: 1 }}>
              {node.name}
            </Text>
            
            {node.hasPage && (
              <>
                <Badge color="green" size="sm">Sayfa Var</Badge>
                <Button
                  component="a"
                  href={routePath}
                  target="_blank"
                  size="xs"
                  variant="light"
                  onClick={(e) => e.stopPropagation()}
                >
                  Aç
                </Button>
              </>
            )}
            
            {!node.hasPage && hasChildren && (
              <Badge color="gray" size="sm">Klasör</Badge>
            )}
            
            {!node.hasPage && !hasChildren && (
              <Badge color="red" size="sm">Sayfa Yok</Badge>
            )}
          </Group>
        </Paper>
        
        {hasChildren && isExpanded && (
          <Collapse in={isExpanded}>
            <div style={{ marginTop: '4px' }}>
              {node.children.map(child => renderNode(child))}
            </div>
          </Collapse>
        )}
      </div>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} mb="xs">
              📁 Dizin Yapısı Test Sayfası
            </Title>
            <Text c="dimmed" size="lg">
              <code>src/app/[locale]</code> dizinindeki tüm klasörlerin hiyerarşik görünümü
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={loadStructure}
              loading={loading}
              variant="light"
            >
              Yenile
            </Button>
            <Button onClick={expandAll} variant="subtle" size="sm">
              Tümünü Aç
            </Button>
            <Button onClick={collapseAll} variant="subtle" size="sm">
              Tümünü Kapat
            </Button>
          </Group>
        </Group>

        <Paper p="md" withBorder>
          <Group gap="lg">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Toplam Klasör
              </Text>
              <Text size="xl" fw={700} c="blue">
                {loading ? <Loader size="sm" /> : stats.total}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Sayfa Olan
              </Text>
              <Text size="xl" fw={700} c="green">
                {loading ? <Loader size="sm" /> : stats.withPages}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Sayfa Olmayan
              </Text>
              <Text size="xl" fw={700} c="red">
                {loading ? <Loader size="sm" /> : stats.withoutPages}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Oran
              </Text>
              <Text size="xl" fw={700} c="violet">
                {loading ? (
                  <Loader size="sm" />
                ) : (
                  `${stats.total > 0 ? Math.round((stats.withPages / stats.total) * 100) : 0}%`
                )}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed" mb="xs">
              📂 Dizin Hiyerarşisi
            </Text>
            {loading ? (
              <Group justify="center" py="xl">
                <Loader size="lg" />
                <Text c="dimmed">Dizin yapısı yükleniyor...</Text>
              </Group>
            ) : structure.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Dizin bulunamadı
              </Text>
            ) : (
              <div>
                {structure.map(node => renderNode(node))}
              </div>
            )}
          </Stack>
        </Paper>

        <Paper p="md" withBorder style={{ backgroundColor: '#fef3c7' }}>
          <Stack gap="xs">
            <Text fw={600} size="sm">
              💡 Bilgi
            </Text>
            <Text size="sm" c="dimmed">
              • <strong>Yeşil kenarlık:</strong> Bu klasörde <code>page.tsx</code> dosyası var (sayfa mevcut)
              <br />
              • <strong>Kırmızı kenarlık:</strong> Bu klasörde <code>page.tsx</code> dosyası yok
              <br />
              • Klasörlere tıklayarak alt dizinleri açıp kapatabilirsiniz
              <br />
              • "Aç" butonu ile sayfayı yeni sekmede açabilirsiniz
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}


