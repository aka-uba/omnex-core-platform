'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Container,
  Paper,
  Tabs,
  Button,
  Group,
  Badge,
  Switch,
  Text,
} from '@mantine/core';
import { IconUser, IconBriefcase, IconPhone, IconFileText, IconFileDescription, IconSettings, IconUserEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useUser, useUpdateUser, useToggleUserStatus } from '@/hooks/useUsers';
import { useTranslation } from '@/lib/i18n/client';
import { PersonalInfoTab } from '../../create/tabs/PersonalInfoTab';
import { WorkInfoTab } from '../../create/tabs/WorkInfoTab';
import { ContactInfoTab } from '../../create/tabs/ContactInfoTab';
import { DocumentsTab } from '../../create/tabs/DocumentsTab';
import { CVTab } from '../../create/tabs/CVTab';
import { PreferencesTab } from '../../create/tabs/PreferencesTab';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import classes from '../../create/CreateUserPage.module.css';
import { EditUserPageSkeleton } from './EditUserPageSkeleton';

export function EditUserPageClient({ locale, userId }: { locale: string; userId: string }) {
  const router = useRouter();
  const { t } = useTranslation('modules/users');
  const { t: tGlobal } = useTranslation('global');
  const [activeTab, setActiveTab] = useState<string | null>('personal');
  const { data: user, isLoading, refetch } = useUser(userId);
  const updateUser = useUpdateUser();
  const toggleStatus = useToggleUserStatus();

  const form = useForm({
    initialValues: {
      personal: {
        profilePicture: undefined,
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      },
      work: {
        department: '',
        position: '',
        employeeId: '',
        hireDate: undefined as any,
        manager: '',
        agencyIds: [],
        role: 'AgencyUser' as const,
      },
      contact: {
        address: '',
        city: '',
        country: '',
        postalCode: '',
        emergencyContact: '',
        emergencyPhone: '',
      },
      documents: {
        passport: undefined,
        idCard: undefined,
        contract: undefined,
        otherDocuments: [],
      },
      cv: {
        cv: undefined,
      },
      preferences: {
        defaultLanguage: 'tr',
        defaultTheme: 'auto' as const,
        defaultLayout: 'comfortable' as const,
      },
    },
    // Validasyonu manuel yapacağız - nested yapıda zodResolver sorun çıkarıyor
  });

  useEffect(() => {
    if (user) {
      form.setValues({
        personal: {
          profilePicture: undefined, // Keep as undefined, we'll use currentProfilePicture prop
          fullName: user.name,
          email: user.email,
          phone: user.phone || '',
          password: '',
          confirmPassword: '',
        },
        work: {
          department: user.department || '',
          position: user.position || '',
          employeeId: user.employeeId || '',
          hireDate: user.hireDate ? new Date(user.hireDate) : undefined,
          manager: '',
          agencyIds: [],
          role: user.role as any,
        },
        contact: {
          address: '',
          city: '',
          country: '',
          postalCode: '',
          emergencyContact: '',
          emergencyPhone: '',
        },
        documents: {
          passport: undefined,
          idCard: undefined,
          contract: undefined,
          otherDocuments: [],
        },
        cv: {
          cv: undefined,
        },
        preferences: {
          defaultLanguage: 'tr',
          defaultTheme: 'auto' as const,
          defaultLayout: 'comfortable' as const,
        },
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    // Temel validasyon
    if (!form.values.personal.fullName || !form.values.personal.email) {
      showToast({
        type: 'error',
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.requiredFields'),
      });
      return;
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.values.personal.email)) {
      showToast({
        type: 'error',
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.invalidEmail'),
      });
      return;
    }

    // Şifre kontrolü (eğer şifre girilmişse)
    if (form.values.personal.password && form.values.personal.password.length < 8) {
      showToast({
        type: 'error',
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.passwordMinLength'),
      });
      return;
    }

    // Şifre eşleşme kontrolü
    if (form.values.personal.password && form.values.personal.password !== form.values.personal.confirmPassword) {
      showToast({
        type: 'error',
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.passwordMismatch'),
      });
      return;
    }

    try {
      const response = await updateUser.mutateAsync({ userId, data: form.values });
      
      // Eğer güncellenen kullanıcı mevcut kullanıcıysa, localStorage'ı güncelle
      if (typeof window !== 'undefined') {
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          try {
            const user = JSON.parse(currentUser);
            if (user.id === userId && response?.user) {
              // Profil resmi ve diğer bilgileri güncelle
              // profilePicture'ı önce response'dan al, yoksa mevcut değeri koru
              const updatedUser = {
                ...user,
                name: response.user.name || user.name,
                email: response.user.email || user.email,
                profilePicture: response.user.profilePicture !== undefined 
                  ? response.user.profilePicture 
                  : user.profilePicture,
              };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              // Custom event dispatch et ki useAuth hook'u güncellensin
              window.dispatchEvent(new Event('user-updated'));
            }
          } catch (e) {
            // Error updating localStorage - silently fail
          }
        }
      }
      
      showToast({
        type: 'success',
        title: t('edit.title'),
        message: tGlobal('notifications.success.userUpdated'),
      });
      router.push(`/${locale}/management/users`);
    } catch (error) {
      showToast({
        type: 'error',
        title: tGlobal('notifications.error.title'),
        message: error instanceof Error ? error.message : tGlobal('notifications.error.userUpdateFailed'),
      });
    }
  };

  if (isLoading) {
    return <EditUserPageSkeleton />;
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="edit.title"
        description="edit.description"
        namespace="modules/users"
        icon={<IconUserEdit size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/management/users`, namespace: 'modules/users' },
          { label: 'edit.title', namespace: 'modules/users' },
        ]}
      />

      <Paper shadow="sm" radius="md" {...(classes.formContainer ? { className: classes.formContainer } : {})}>
        <Tabs {...(activeTab ? { value: activeTab } : {})} onChange={setActiveTab} {...(classes.tabs ? { className: classes.tabs } : {})}>
          <Tabs.List {...(classes.tabsList ? { className: classes.tabsList } : {})}>
            <Tabs.Tab value="personal" leftSection={<IconUser size={16} />}>
              {t('tabs.personal')}
            </Tabs.Tab>
            <Tabs.Tab value="work" leftSection={<IconBriefcase size={16} />}>
              {t('tabs.work')}
            </Tabs.Tab>
            <Tabs.Tab value="contact" leftSection={<IconPhone size={16} />}>
              {t('tabs.contact')}
            </Tabs.Tab>
            <Tabs.Tab value="documents" leftSection={<IconFileText size={16} />}>
              {t('tabs.documents')}
            </Tabs.Tab>
            <Tabs.Tab value="cv" leftSection={<IconFileDescription size={16} />}>
              {t('tabs.cv')}
            </Tabs.Tab>
            <Tabs.Tab value="preferences" leftSection={<IconSettings size={16} />}>
              {t('tabs.preferences')}
            </Tabs.Tab>
          </Tabs.List>

          {/* User Status Section */}
          <Paper p="md" mt="md" mb="md" radius="md" withBorder bg="var(--mantine-color-gray-0)">
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Text fw={500} size="sm">{t('edit.userStatus')}</Text>
                <Badge
                  color={user?.status === 'active' ? 'green' : user?.status === 'pending' ? 'yellow' : 'gray'}
                  size="lg"
                >
                  {user?.status === 'active' ? t('status.active') : user?.status === 'pending' ? t('status.pending') : t('status.inactive')}
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">{t('edit.toggleStatus')}</Text>
                <Switch
                  checked={user?.status === 'active'}
                  onChange={async () => {
                    const newStatus = user?.status === 'active' ? 'inactive' : 'active';
                    try {
                      await toggleStatus.mutateAsync({ userId, status: newStatus });
                      refetch();
                      showToast({
                        type: 'success',
                        title: t('edit.statusUpdated'),
                        message: newStatus === 'active' ? t('edit.userActivated') : t('edit.userDeactivated'),
                      });
                    } catch (error) {
                      showToast({
                        type: 'error',
                        title: tGlobal('notifications.error.title'),
                        message: error instanceof Error ? error.message : tGlobal('notifications.error.statusUpdateFailed'),
                      });
                    }
                  }}
                  disabled={toggleStatus.isPending}
                  size="md"
                  color="green"
                />
              </Group>
            </Group>
          </Paper>

          <Tabs.Panel value="personal" pt="md">
            <PersonalInfoTab form={form as any} {...(user?.profilePicture ? { currentProfilePicture: user.profilePicture } : {})} />
          </Tabs.Panel>

          <Tabs.Panel value="work" pt="md">
            <WorkInfoTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="contact" pt="md">
            <ContactInfoTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="documents" pt="md">
            <DocumentsTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="cv" pt="md">
            <CVTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="preferences" pt="md">
            <PreferencesTab form={form as any} />
          </Tabs.Panel>
        </Tabs>

        <div className={classes.actionBar}>
          <Group justify="flex-end" gap="md">
            <Button variant="subtle" onClick={() => router.back()}>
              {tGlobal('form.cancel')}
            </Button>
            <Button variant="filled" onClick={handleSubmit} loading={updateUser.isPending}>
              {t('edit.button')}
            </Button>
          </Group>
        </div>
      </Paper>
    </Container>
  );
}

