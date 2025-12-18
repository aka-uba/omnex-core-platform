'use client';

import { useEffect, useState } from 'react';
import { Select, Group, Stack, Text, Loader, SegmentedControl } from '@mantine/core';
import { IconUser, IconShield, IconBuilding } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

interface ScopeSelectorProps {
    lang: string;
    onScopeChange: (scope: { type: 'tenant' | 'role' | 'user'; id?: string }) => void;
}

export function ScopeSelector({ lang, onScopeChange }: ScopeSelectorProps) {
    const { t } = useTranslation('global');
    const [scopeType, setScopeType] = useState<'tenant' | 'role' | 'user'>('tenant');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Fetch users and roles
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch roles
                const rolesRes = await fetch('/api/roles'); // Assuming this endpoint exists
                const rolesData = await rolesRes.json();
                if (rolesData.success) {
                    setRoles(rolesData.data || []);
                }

                // Fetch users
                const usersRes = await fetch('/api/users'); // Assuming this endpoint exists
                const usersData = await usersRes.json();
                if (usersData.success) {
                    // API returns { users: [...], total, page, pageSize }
                    setUsers(usersData.data?.users || []);
                }
            } catch (error) {
                console.error('Error fetching scope data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle scope type change
    const handleTypeChange = (value: string) => {
        const newType = value as 'tenant' | 'role' | 'user';
        setScopeType(newType);
        setSelectedId(null);

        // If tenant is selected, immediately notify parent (id is undefined for tenant-wide)
        if (newType === 'tenant') {
            onScopeChange({ type: 'tenant' });
        }
    };

    // Handle ID selection change
    const handleIdChange = (value: string | null) => {
        setSelectedId(value);
        if (value) {
            onScopeChange({ type: scopeType, id: value });
        }
    };

    return (
        <Stack gap="md" p="md" bg="var(--mantine-color-body)" style={{ borderRadius: '8px', border: '1px solid var(--mantine-color-gray-3)' }}>
            <Group justify="space-between">
                <Group>
                    {scopeType === 'tenant' && <IconBuilding size={20} />}
                    {scopeType === 'role' && <IconShield size={20} />}
                    {scopeType === 'user' && <IconUser size={20} />}
                    <Text fw={500}>{t('accessControl.scope.title')}</Text>
                </Group>

                <SegmentedControl
                    value={scopeType}
                    onChange={handleTypeChange}
                    data={[
                        { label: t('accessControl.scope.tenant'), value: 'tenant' },
                        { label: t('accessControl.scope.role'), value: 'role' },
                        { label: t('accessControl.scope.user'), value: 'user' },
                    ]}
                />
            </Group>

            {scopeType !== 'tenant' && (
                <Select
                    label={scopeType === 'role' 
                        ? t('accessControl.scope.selectRole')
                        : t('accessControl.scope.selectUser')
                    }
                    placeholder={loading 
                        ? t('common.loading')
                        : (scopeType === 'role' 
                            ? t('accessControl.scope.chooseRole')
                            : t('accessControl.scope.chooseUser')
                        )
                    }
                    data={scopeType === 'role'
                        ? roles.map(r => ({ value: r.id.toString(), label: r.name }))
                        : users.map(u => ({ value: u.id.toString(), label: `${u.name} (${u.email})` }))
                    }
                    value={selectedId}
                    onChange={handleIdChange}
                    searchable
                    clearable
                    disabled={loading}
                    rightSection={loading ? <Loader size="xs" /> : null}
                />
            )}

            <Text size="xs" c="dimmed">
                {scopeType === 'tenant'
                    ? t('accessControl.scope.tenantHelp')
                    : scopeType === 'role'
                        ? t('accessControl.scope.roleHelp')
                        : t('accessControl.scope.userHelp')
                }
            </Text>
        </Stack>
    );
}
