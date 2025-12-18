'use client';

import { useState, useEffect } from 'react';
import { Grid, Stack, Title, Text, Container, LoadingOverlay, Group, Button } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { MenuList } from './components/MenuList';
import { MenuBuilder } from './components/MenuBuilder';
import { PageSelector } from './components/PageSelector';
import { LocationAssignment } from './components/LocationAssignment';
import { MenuItemEditor } from './components/MenuItemEditor';
import { useDisclosure } from '@mantine/hooks';

export function MenuManagementPageClient() {
  const { t } = useTranslation('modules/menu-management');
  const [menus, setMenus] = useState<any[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<any | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Item editor state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editorOpen, { open: openEditor, close: closeEditor }] = useDisclosure(false);

  // Mock roles - fetch from API in real app
  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'editor', label: 'Editor' },
    { value: 'user', label: 'User' },
  ];

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    if (activeMenuId) {
      fetchMenuItems(activeMenuId);
      const menu = menus.find(m => m.id === activeMenuId);
      setActiveMenu(menu || null);
    } else {
      setMenuItems([]);
      setActiveMenu(null);
    }
  }, [activeMenuId, menus]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/menus');
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        throw new Error(`Failed to fetch menus: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setMenus(result.data);
        // Select first menu if none selected
        if (!activeMenuId && result.data.length > 0) {
          setActiveMenuId(result.data[0].id);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch menus');
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
      // Error is already handled by fetchWithAuth (redirect to login if 401)
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (menuId: string) => {
    setItemsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/menus/${menuId}/items`);
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        throw new Error(`Failed to fetch menu items: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setMenuItems(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch menu items');
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      // Error is already handled by fetchWithAuth (redirect to login if 401)
    } finally {
      setItemsLoading(false);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    openEditor();
  };

  return (
    <Container fluid p="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>{t('title')}</Title>
            <Text c="dimmed">{t('description')}</Text>
          </div>
          <Button
            component="a"
            href="/settings/menu-management/footer"
            variant="light"
          >
            Footer Özelleştirme
          </Button>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <MenuList
              menus={menus}
              activeMenuId={activeMenuId}
              onSelectMenu={setActiveMenuId}
              onMenuCreated={fetchMenus}
              onMenuUpdated={fetchMenus}
              onMenuDeleted={() => {
                setActiveMenuId(null);
                fetchMenus();
              }}
              isLoading={loading}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 9 }}>
            {activeMenuId ? (
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack>
                    <PageSelector
                      menuId={activeMenuId}
                      onItemsAdded={() => fetchMenuItems(activeMenuId)}
                    />
                    <LocationAssignment
                      menuId={activeMenuId}
                      menuName={activeMenu?.name || ''}
                    />
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 8 }}>
                  <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={itemsLoading} />
                    <MenuBuilder
                      menuId={activeMenuId}
                      items={menuItems}
                      onUpdateItems={() => fetchMenuItems(activeMenuId)}
                      onEditItem={handleEditItem}
                    />
                  </div>
                </Grid.Col>
              </Grid>
            ) : (
              <Container p="xl" style={{ textAlign: 'center' }}>
                <Text c="dimmed">{t('selectOrCreateMenu')}</Text>
              </Container>
            )}
          </Grid.Col>
        </Grid>
      </Stack>

      <MenuItemEditor
        opened={editorOpen}
        onClose={() => {
          closeEditor();
          setEditingItem(null);
        }}
        item={editingItem}
        menuId={activeMenuId || ''}
        onUpdate={() => fetchMenuItems(activeMenuId || '')}
        roles={roles}
      />
    </Container>
  );
}
