'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Container,
  Paper,
  Tabs,
  Button,
  Group,
} from '@mantine/core';
import { IconUser, IconBriefcase, IconPhone, IconFileText, IconFileDescription, IconSettings, IconUserPlus } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useCreateUser } from '@/hooks/useUsers';
import { useTranslation } from '@/lib/i18n/client';
import { PersonalInfoTab } from './tabs/PersonalInfoTab';
import { WorkInfoTab } from './tabs/WorkInfoTab';
import { ContactInfoTab } from './tabs/ContactInfoTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { CVTab } from './tabs/CVTab';
import { PreferencesTab } from './tabs/PreferencesTab';
import { notifications } from '@mantine/notifications';
import classes from './CreateUserPage.module.css';

export function CreateUserPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { t } = useTranslation('modules/users');
  const { t: tGlobal } = useTranslation('global');
  const [activeTab, setActiveTab] = useState<string | null>('personal');
  const createUser = useCreateUser();

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
        hireDate: undefined,
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

  const handleSubmit = async () => {
    // Temel validasyon
    if (!form.values.personal.fullName || !form.values.personal.email) {
      notifications.show({
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.requiredFields'),
        color: 'red',
      });
      return;
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.values.personal.email)) {
      notifications.show({
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.invalidEmail'),
        color: 'red',
      });
      return;
    }

    // Şifre kontrolü (oluşturma için zorunlu)
    if (!form.values.personal.password || form.values.personal.password.length < 8) {
      notifications.show({
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.passwordMinLength'),
        color: 'red',
      });
      return;
    }

    // Şifre eşleşme kontrolü
    if (form.values.personal.password !== form.values.personal.confirmPassword) {
      notifications.show({
        title: tGlobal('notifications.validation.title'),
        message: tGlobal('notifications.validation.passwordMismatch'),
        color: 'red',
      });
      return;
    }

    try {
      await createUser.mutateAsync(form.values);
      notifications.show({
        title: t('create.title'),
        message: tGlobal('notifications.success.userCreated'),
        color: 'green',
      });
      router.push(`/${locale}/users`);
    } catch (error) {
      notifications.show({
        title: tGlobal('notifications.error.title'),
        message: error instanceof Error ? error.message : tGlobal('notifications.error.userCreateFailed'),
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="create.title"
        description="create.description"
        namespace="modules/users"
        icon={<IconUserPlus size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/users`, namespace: 'modules/users' },
          { label: 'create.title', namespace: 'modules/users' },
        ]}
      />

      <Paper shadow="sm" radius="md" className={classes.formContainer}>
        <Tabs value={activeTab} onChange={setActiveTab} className={classes.tabs}>
          <Tabs.List className={classes.tabsList}>
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

          <Tabs.Panel value="personal" pt={0}>
            <PersonalInfoTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="work" pt={0}>
            <WorkInfoTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="contact" pt={0}>
            <ContactInfoTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="documents" pt={0}>
            <DocumentsTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="cv" pt={0}>
            <CVTab form={form as any} />
          </Tabs.Panel>

          <Tabs.Panel value="preferences" pt={0}>
            <PreferencesTab form={form as any} />
          </Tabs.Panel>
        </Tabs>

        {/* Action Bar */}
        <div className={classes.actionBar}>
          <Group justify="flex-end" gap="md">
            <Button
              variant="default"
              onClick={() => router.back()}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createUser.isPending}
            >
              {t('create.button')}
            </Button>
          </Group>
        </div>
      </Paper>
    </Container>
  );
}

