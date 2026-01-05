import { useState, useEffect } from 'react';
import {
    Paper,
    Title,
    Button,
    Stack,
    Group,
    Text,
    Loader,
    Badge,
    Select,
    Checkbox,
    ActionIcon,
    Divider
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface Location {
    id: string;
    name: string;
    label: any;
    assignments: any[];
}

interface Role {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface LocationAssignmentProps {
    menuId: string;
    menuName: string;
}

export function LocationAssignment({ menuId, menuName }: LocationAssignmentProps) {
    const { t: tGlobal } = useTranslation('global');
    const t = (key: string) => tGlobal(`settings.menuManagement.${key}`);
    const { confirm, ConfirmDialog } = useConfirmDialog();
    const [locations, setLocations] = useState<Location[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New assignment state - now supports multiple locations
    const [newAssignment, setNewAssignment] = useState<{
        locationIds: string[];
        type: 'default' | 'role' | 'user';
        targetId: string | null;
    }>({ locationIds: [], type: 'default', targetId: null });

    useEffect(() => {
        fetchData();
    }, [menuId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [locRes, rolesRes, usersRes] = await Promise.all([
                fetchWithAuth('/api/menu-locations'),
                fetchWithAuth('/api/roles'),
                fetchWithAuth('/api/users')
            ]);

            const locData = await locRes.json();
            const rolesData = await rolesRes.json();
            const usersData = await usersRes.json();

            if (locData.success) setLocations(locData.data);
            if (rolesData.success) setRoles(rolesData.data || []);
            if (usersData.success) {
                // Users API returns { success: true, data: { users: [], total, page, pageSize } }
                const usersList = usersData.data?.users || usersData.users || [];
                setUsers(usersList.map((u: any) => ({ 
                    id: u.id, 
                    name: u.name || u.email || 'Unknown', 
                    email: u.email || '' 
                })));
            } else {
                console.error('Users API error:', usersData);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            showToast({
                type: 'error',
                title: t('error'),
                message: t('fetchLocationsError'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddAssignment = async () => {
        if (newAssignment.locationIds.length === 0) return;
        if (newAssignment.type !== 'default' && !newAssignment.targetId) return;

        setSaving(true);
        try {
            // Add assignment to each selected location
            await Promise.all(
                newAssignment.locationIds.map(locationId =>
                    fetchWithAuth(`/api/menu-locations/${locationId}/assign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            menuId,
                            assignmentType: newAssignment.type,
                            assignmentId: newAssignment.targetId,
                            priority: newAssignment.type === 'default' ? 0 : 1
                        }),
                    })
                )
            );

            showToast({
                type: 'success',
                title: t('success'),
                message: t('assignmentUpdated'),
            });

            // Reset form and refresh
            setNewAssignment({ locationIds: [], type: 'default', targetId: null });
            fetchData();

            // Trigger menu update event to refresh menus in sidebar/top/mobile
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('menu-updated'));
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: t('updateError'),
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAssignment = async (locationId: string, assignmentId: string) => {
        const confirmed = await confirm({
            title: t('deleteAssignmentTitle'),
            message: t('confirmDeleteItem'),
            confirmLabel: t('delete'),
            confirmColor: 'red',
        });

        if (!confirmed) return;

        setSaving(true);
        try {
            await fetchWithAuth(`/api/menu-locations/${locationId}/assign?assignmentId=${assignmentId}`, {
                method: 'DELETE',
            });

            showToast({
                type: 'success',
                title: t('success'),
                message: t('assignmentUpdated'),
            });

            fetchData();
            
            // Trigger menu update event to refresh menus in sidebar/top/mobile
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('menu-updated'));
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: t('updateError'),
            });
        } finally {
            setSaving(false);
        }
    };

    const getLabel = (loc: Location) => {
        if (typeof loc.label === 'string') return loc.label;
        return loc.label['tr'] || loc.label['en'] || Object.values(loc.label)[0];
    };

    if (loading) {
        return (
            <Paper p="md" withBorder>
                <Group justify="center">
                    <Loader size="sm" />
                </Group>
            </Paper>
        );
    }

    return (
        <Paper p="md" withBorder>
            <Title order={5} mb="md">{t('menuSettings')}</Title>

            <Text size="sm" fw={500} mb="xs">{t('displayLocation')}</Text>

            <Stack gap="md">
                {/* List existing assignments for this menu */}
                {locations.map(location => {
                    const myAssignments = location.assignments?.filter((a: any) => a.menuId === menuId) || [];

                    if (myAssignments.length === 0) return null;

                    return (
                        <div key={location.id}>
                            <Text size="xs" c="dimmed" mb={4}>{getLabel(location)}</Text>
                            <Stack gap="xs">
                                {myAssignments.map((assignment: any) => (
                                    <Group key={assignment.id} justify="space-between" bg="gray.0" p="xs" style={{ borderRadius: 4 }}>
                                        <Group gap="xs">
                                            <Badge size="sm" variant="dot">
                                                {assignment.assignmentType === 'default' ? t('general') :
                                                    assignment.assignmentType === 'role' ? t('requiredRole') :
                                                        t('user')}
                                            </Badge>
                                            {assignment.assignmentType === 'role' && (
                                                <Text size="sm">{roles.find(r => r.id === assignment.assignmentId)?.name || assignment.assignmentId}</Text>
                                            )}
                                            {assignment.assignmentType === 'user' && (
                                                <Text size="sm">{users.find(u => u.id === assignment.assignmentId)?.name || assignment.assignmentId}</Text>
                                            )}
                                        </Group>
                                        <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleDeleteAssignment(location.id, assignment.id)}>
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Group>
                                ))}
                            </Stack>
                        </div>
                    );
                })}

                <Divider my="xs" label={t('addToMenu')} labelPosition="center" />

                {/* Add new assignment form */}
                <Stack gap="xs">
                    <Text size="sm" fw={500}>{t('displayLocation')}</Text>
                    <Checkbox.Group
                        value={newAssignment.locationIds}
                        onChange={(values) => setNewAssignment({ ...newAssignment, locationIds: values })}
                    >
                        <Stack gap="xs">
                            {locations.map(l => (
                                <Checkbox
                                    key={l.id}
                                    value={l.id}
                                    label={getLabel(l)}
                                />
                            ))}
                        </Stack>
                    </Checkbox.Group>

                    {newAssignment.locationIds.length > 0 && (
                        <>
                            <Divider my="xs" />
                            <Select
                                label={t('assignmentType')}
                                placeholder={t('selectType')}
                                data={[
                                    { value: 'default', label: t('general') },
                                    { value: 'role', label: t('requiredRole') },
                                    { value: 'user', label: t('user') }
                                ]}
                                value={newAssignment.type}
                                onChange={(val: any) => setNewAssignment({ ...newAssignment, type: val, targetId: null })}
                            />

                            {newAssignment.type === 'role' && (
                                <Select
                                    label={t('selectRole')}
                                    placeholder={t('selectRole')}
                                    data={roles.map(r => ({ value: r.id, label: r.name }))}
                                    value={newAssignment.targetId}
                                    onChange={(val) => setNewAssignment({ ...newAssignment, targetId: val })}
                                />
                            )}

                            {newAssignment.type === 'user' && (
                                <Select
                                    label={t('selectUser')}
                                    placeholder={t('selectUser')}
                                    data={users.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                                    value={newAssignment.targetId}
                                    onChange={(val) => setNewAssignment({ ...newAssignment, targetId: val })}
                                    searchable
                                />
                            )}

                            <Button
                                fullWidth
                                onClick={handleAddAssignment}
                                disabled={newAssignment.locationIds.length === 0 || (newAssignment.type !== 'default' && !newAssignment.targetId)}
                                loading={saving}
                            >
                                {t('save')}
                            </Button>
                        </>
                    )}
                </Stack>
            </Stack>
            <ConfirmDialog />
        </Paper>
    );
}
