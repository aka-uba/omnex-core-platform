'use client';

import { useState, useEffect, Fragment, useCallback } from 'react';
import { Paper, Button, Group, TextInput, Textarea, Alert, Progress, Code, Badge, Checkbox, Modal, Stack, Title, Text, Card, Box, Loader, ScrollArea, Divider, ThemeIcon, Tabs, PasswordInput, NumberInput, Select, CopyButton, ActionIcon, Tooltip, Collapse } from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle, IconRefresh, IconDownload, IconDatabase, IconTrash, IconServer, IconRocket, IconTerminal, IconBrandGithub, IconCopy, IconSettings, IconKey, IconWorld, IconChevronDown, IconChevronUp, IconFileCode, IconNetwork, IconShieldCheck } from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';
import { SecurityAudit as SecurityAuditPanel } from './SecurityAudit';

interface StepStatus {
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  error?: string;
  solution?: string;
  output?: string;
}

interface SetupConfig {
  coreDatabaseUrl: string;
  tenantDatabaseUrl: string;
  tenantSlug: string;
  forceReset: boolean;
}

interface DemoModule {
  slug: string;
  name: string;
  description: string;
  dependencies: string[];
  hasData?: boolean;
  count?: number;
}

// Production Deploy Types
interface ServerConfig {
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  password: string;
  privateKey: string;
}

interface DeployConfig {
  appName: string;
  domain: string;
  repoUrl: string;
  branch: string;
  nodeVersion: string;
  pm2Instances: number;
  enableSsl: boolean;
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  databaseUser: string;
  databasePassword: string;
}

interface DeployStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: 'pending' | 'running' | 'success' | 'error';
  output?: string;
  error?: string;
}

interface GeneratedScripts {
  deployScript: string;
  ecosystemConfig: string;
  nginxConfig: string;
  githubWorkflow: string;
}

const STEP_KEYS = [
  'testConnection',
  'createDatabase',
  'schemaMerge',
  'schemaValidate',
  'dbPush',
  'generateClient',
  'coreSeed',
  'tenantSeed',
  'demoSeed',
] as const;

export function SetupWizard() {
  const { t } = useTranslation('global');
  const [activeStep, setActiveStep] = useState(0);
  
  const STEPS = STEP_KEYS.map(key => ({
    label: t(`setup.steps.${key}.label`),
    description: t(`setup.steps.${key}.description`),
  }));
  
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    STEP_KEYS.map(() => ({ status: 'pending' }))
  );
  const [config, setConfig] = useState<SetupConfig>({
    coreDatabaseUrl: process.env.NEXT_PUBLIC_CORE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/omnex_core',
    tenantDatabaseUrl: process.env.NEXT_PUBLIC_TENANT_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tenant_omnexcore_2025',
    tenantSlug: 'omnexcore',
    forceReset: false,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [completionModalOpened, setCompletionModalOpened] = useState(false);
  const [completionNotified, setCompletionNotified] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Demo modules modal state
  const [demoModalOpened, setDemoModalOpened] = useState(false);
  const [demoModalMode, setDemoModalMode] = useState<'seed' | 'unseed'>('seed');
  const [demoModules, setDemoModules] = useState<DemoModule[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [processingDemo, setProcessingDemo] = useState(false);
  const [selectedDemoLocale, setSelectedDemoLocale] = useState<string>('tr');

  // Production Deploy state
  const [activeTab, setActiveTab] = useState<string | null>('database');
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    host: '',
    port: 22,
    username: 'root',
    authMethod: 'key',
    password: '',
    privateKey: '',
  });
  const [deployConfig, setDeployConfig] = useState<DeployConfig>({
    appName: 'omnex-app',
    domain: '',
    repoUrl: '',
    branch: 'main',
    nodeVersion: '20',
    pm2Instances: 4,
    enableSsl: true,
    databaseHost: 'localhost',
    databasePort: 5432,
    databaseName: 'tenant_omnexcore_2025',
    databaseUser: 'omnex_user',
    databasePassword: '',
  });
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([]);
  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScripts | null>(null);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedScript, setExpandedScript] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const updateStepStatus = (step: number, status: Partial<StepStatus>) => {
    setStepStatuses((prev) => {
      const newStatuses = [...prev];
      // Filter out undefined values to satisfy exactOptionalPropertyTypes
      const filteredStatus = Object.fromEntries(
        Object.entries(status).filter(([_, value]) => value !== undefined)
      ) as Partial<StepStatus>;
      const currentStatus = newStatuses[step];
      if (currentStatus) {
        newStatuses[step] = { ...currentStatus, ...filteredStatus };
      }
      return newStatuses;
    });
  };

  const executeStep = async (step: number) => {
    if (isRunning) return;

    setIsRunning(true);
    updateStepStatus(step, { status: 'running' });
      addLog(`${t('setup.actions.runStep')} ${step + 1}: ${STEPS[step]?.label || t('setup.steps.unknown')}`);

    try {
      let response: Response;
      let result: any;

      switch (step) {
        case 0: // Test connections
          // Test core
          response = await fetch('/api/setup/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              databaseUrl: config.coreDatabaseUrl,
              type: 'core',
            }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);

          // Test tenant
          response = await fetch('/api/setup/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              databaseUrl: config.tenantDatabaseUrl,
              type: 'tenant',
            }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);

          updateStepStatus(step, {
            status: 'success',
            message: t('setup.messages.databaseConnectionSuccess'),
          });
          break;

        case 1: // Create databases
          // Create core
          const coreDbName = config.coreDatabaseUrl.split('/').pop()?.split('?')[0] || 'omnex_core';
          response = await fetch('/api/setup/create-database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              databaseName: coreDbName,
              connectionString: config.coreDatabaseUrl,
            }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);
          addLog(`Core database: ${result.message}`);

          // Create tenant
          const tenantDbName = config.tenantDatabaseUrl.split('/').pop()?.split('?')[0] || 'tenant_omnexcore_2025';
          response = await fetch('/api/setup/create-database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              databaseName: tenantDbName,
              connectionString: config.tenantDatabaseUrl,
            }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);
          addLog(`Tenant database: ${result.message}`);

          updateStepStatus(step, {
            status: 'success',
            message: t('setup.messages.databasesCreated'),
          });
          break;

        case 2: // Schema merge
          response = await fetch('/api/setup/schema-merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);

          updateStepStatus(step, {
            status: 'success',
            message: result.message,
            output: result.output,
          });
          break;

        case 3: // Schema validation
          response = await fetch('/api/setup/validate-schema', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validationType: 'all' }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.errors?.[0]?.error || result.error);

          updateStepStatus(step, {
            status: 'success',
            message: result.message,
            output: JSON.stringify(result.validations, null, 2),
          });
          break;

        case 4: // Database push
          // Core
          response = await fetch('/api/setup/db-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              databaseType: 'core',
              forceReset: config.forceReset,
              coreDatabaseUrl: config.coreDatabaseUrl,
            }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);
          addLog(t('setup.messages.coreSchemaApplied'));

          // Tenant
          response = await fetch('/api/setup/db-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              databaseType: 'tenant',
              forceReset: config.forceReset,
              tenantDatabaseUrl: config.tenantDatabaseUrl,
            }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);
          addLog(t('setup.messages.tenantSchemaApplied'));

          updateStepStatus(step, {
            status: 'success',
            message: t('setup.messages.bothSchemasApplied'),
          });
          break;

        case 5: // Generate clients
          response = await fetch('/api/setup/generate-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientType: 'both' }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.errors?.[0]?.error || result.error);

          // Handle warnings (EPERM is usually harmless)
          let message = result.message;
          if (result.warnings && result.warnings.length > 0) {
            message += '\n⚠️ ' + result.warnings.join('\n⚠️ ');
          }

          updateStepStatus(step, {
            status: 'success',
            message: message,
            output: JSON.stringify(result.results, null, 2),
          });
          break;

        case 6: // Core seed
          // Extract database name from tenant database URL
          const coreSeedDbNameMatch = config.tenantDatabaseUrl.match(/\/([^\/]+)$/);
          const coreSeedTenantDbName = coreSeedDbNameMatch ? coreSeedDbNameMatch[1] : `tenant_${config.tenantSlug}_2025`;
          
          response = await fetch('/api/setup/run-seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              seedType: 'core',
              tenantSlug: config.tenantSlug,
              tenantName: `${config.tenantSlug.charAt(0).toUpperCase() + config.tenantSlug.slice(1)} Company`,
              tenantDbName: coreSeedTenantDbName,
              coreDatabaseUrl: config.coreDatabaseUrl,
            }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);

          updateStepStatus(step, {
            status: 'success',
            message: result.message,
            output: result.output,
          });
          break;

        case 7: // Tenant seed
          response = await fetch('/api/setup/run-seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              seedType: 'tenant',
              tenantSlug: config.tenantSlug,
              coreDatabaseUrl: config.coreDatabaseUrl,
              tenantDatabaseUrl: config.tenantDatabaseUrl,
            }),
          });
          result = await response.json();
          if (!result.success) throw new Error(result.error);

          updateStepStatus(step, {
            status: 'success',
            message: result.message,
            output: result.output,
          });
          break;

        case 8: // Demo seed - modül seçim modal'ı aç
          // Modal modunda çalıştır
          openDemoModal('seed');
          // Modal'da işlem yapılacağı için step durumunu güncelleme
          setIsRunning(false);
          return; // executeStep'ten erken çık
      }

      addLog(t('setup.messages.stepCompleted'));
      showToast({
        type: 'success',
        title: t('setup.actions.success'),
        message: `${STEPS[step]?.label || t('setup.steps.unknown')} ${t('setup.status.completed')}`,
      });

      // Check completion after status update
      setTimeout(() => {
        checkCompletion();
      }, 500);

      // Auto-advance to next step if enabled
      if (autoAdvance && step < STEPS.length - 1) {
        setTimeout(() => {
          setActiveStep(step + 1);
          executeStep(step + 1);
        }, 1000); // 1 second delay before auto-advance
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      updateStepStatus(step, {
        status: 'error',
        error: errorMessage,
        solution: error.solution || 'Check logs for details',
      });
      addLog(t('setup.messages.stepFailed'));
      showToast({
        type: 'error',
        title: t('setup.actions.error'),
        message: `${STEPS[step]?.label || t('setup.steps.unknown')} ${t('setup.status.error')}: ${errorMessage}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAllSteps = async () => {
    for (let i = 0; i < STEPS.length; i++) {
      await executeStep(i);
      // Small delay between steps
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    
    // Check if all steps completed successfully
    const allCompleted = stepStatuses.every(status => status.status === 'success');
    if (allCompleted) {
      setCompletionModalOpened(true);
    }
  };
  
  const checkCompletion = (): void => {
    // Use a small delay to ensure state is updated
    setTimeout(() => {
      const allCompleted = stepStatuses.every(status => status.status === 'success');
      if (allCompleted && stepStatuses.length === STEPS.length && !completionModalOpened) {
        setCompletionModalOpened(true);
        showToast({
          type: 'success',
          title: t('setup.messages.allStepsCompleted'),
          message: t('setup.messages.setupComplete'),
          duration: 5000,
        });
      }
    }, 300);
  };
  
  // Also check on stepStatuses change (only when all are success)
  useEffect(() => {
    const allCompleted = stepStatuses.every(status => status.status === 'success');
    if (allCompleted && stepStatuses.length === STEPS.length && !completionModalOpened && !completionNotified) {
      // Use a ref to prevent multiple triggers
      const timeoutId = setTimeout(() => {
        setCompletionModalOpened(true);
        setCompletionNotified(true);
        showToast({
          type: 'success',
          title: t('setup.messages.allStepsCompleted'),
          message: t('setup.messages.setupComplete'),
          duration: 5000,
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [stepStatuses, completionModalOpened, completionNotified]);
  
  const generateReport = (format: 'txt' | 'md') => {
    const timestamp = new Date().toLocaleString('tr-TR');
    const report = format === 'md' 
      ? generateMarkdownReport(timestamp)
      : generateTextReport(timestamp);
    
    const blob = new Blob([report], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnex-setup-report-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const generateMarkdownReport = (timestamp: string): string => {
    let report = `# Omnex Veritabanı Kurulum Raporu\n\n`;
    report += `**Tarih:** ${timestamp}\n\n`;
    report += `**Durum:** ✅ Tüm aşamalar başarıyla tamamlandı\n\n`;
    report += `---\n\n`;
    
    report += `## Yapılandırma\n\n`;
    report += `- **Core Database URL:** ${config.coreDatabaseUrl}\n`;
    report += `- **Tenant Database URL:** ${config.tenantDatabaseUrl}\n`;
    report += `- **Tenant Slug:** ${config.tenantSlug}\n`;
    report += `- **Force Reset:** ${config.forceReset ? 'Evet' : 'Hayır'}\n\n`;
    
    report += `## Adımlar\n\n`;
    STEPS.forEach((step, index) => {
      const status = stepStatuses[index];
      report += `### ${index + 1}. ${step.label}\n\n`;
      report += `**Açıklama:** ${step.description}\n\n`;
      report += `**Durum:** ${status?.status === 'success' ? '✅ Başarılı' : status?.status === 'error' ? '❌ Hata' : status?.status === 'running' ? '⏳ Çalışıyor' : '⏸️ Beklemede'}\n\n`;
      if (status?.message) {
        report += `**Mesaj:** ${status?.message}\n\n`;
      }
      if (status?.error) {
        report += `**Hata:** ${status?.error}\n\n`;
        if (status?.solution) {
          report += `**Çözüm:** ${status?.solution}\n\n`;
        }
      }
      if (status?.output) {
        report += `**Detaylı Çıktı:**\n\n\`\`\`\n${status?.output}\n\`\`\`\n\n`;
      }
      report += `---\n\n`;
    });
    
    if (logs.length > 0) {
      report += `## Loglar\n\n\`\`\`\n${logs.join('\n')}\n\`\`\`\n\n`;
    }
    
    return report;
  };
  
  const generateTextReport = (timestamp: string): string => {
    let report = `OMNEX VERİTABANI KURULUM RAPORU\n`;
    report += `=====================================\n\n`;
    report += `Tarih: ${timestamp}\n`;
    report += `Durum: Tüm aşamalar başarıyla tamamlandı\n\n`;
    report += `YAPILANDIRMA\n`;
    report += `-------------\n`;
    report += `Core Database URL: ${config.coreDatabaseUrl}\n`;
    report += `Tenant Database URL: ${config.tenantDatabaseUrl}\n`;
    report += `Tenant Slug: ${config.tenantSlug}\n`;
    report += `Force Reset: ${config.forceReset ? t('common.labels.yes') : t('common.labels.no')}\n\n`;
    
    report += `ADIMLAR\n`;
    report += `-------\n\n`;
    STEPS.forEach((step, index) => {
      const status = stepStatuses[index];
      report += `${index + 1}. ${step.label}\n`;
      report += `   Açıklama: ${step.description}\n`;
      report += `   Durum: ${status?.status === 'success' ? t('setup.actions.success') : status?.status === 'error' ? t('setup.actions.error') : status?.status === 'running' ? 'Çalışıyor' : t('metrics.pending')}\n`;
      if (status?.message) {
        report += `   Mesaj: ${status?.message}\n`;
      }
      if (status?.error) {
        report += `   Hata: ${status?.error}\n`;
        if (status?.solution) {
          report += `   Çözüm: ${status?.solution}\n`;
        }
      }
      if (status?.output) {
        report += `   Detaylı Çıktı:\n`;
        report += `   ${status?.output.split('\n').join('\n   ')}\n`;
      }
      report += `\n`;
    });
    
    if (logs.length > 0) {
      report += `LOGLAR\n`;
      report += `------\n\n`;
      report += logs.join('\n') + '\n';
    }
    
    return report;
  };

  const resetStep = (step: number) => {
    updateStepStatus(step, { status: 'pending' });
  };

  // Check access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/setup/check-access');
        const result = await response.json();
        if (result.allowed) {
          setAccessAllowed(true);
        } else {
          setAccessAllowed(false);
          setAccessError(result.reason || t('setup.messages.accessDenied'));
        }
      } catch (error: any) {
        // In development, allow access even if check fails
        if (process.env.NODE_ENV === 'development') {
          setAccessAllowed(true);
        } else {
          setAccessAllowed(false);
          setAccessError(t('setup.messages.accessCheckFailed'));
        }
      }
    };
    checkAccess();
  }, []);

  const resetDatabase = async (type: 'core' | 'tenant' | 'both') => {
    setIsRunning(true);
      addLog(`${type === 'both' ? t('common.labels.all') : type === 'core' ? 'Core' : 'Tenant'} ${t('setup.messages.databaseResetting')}`);

    try {
      const response = await fetch('/api/setup/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          databaseType: type,
          coreDatabaseUrl: config.coreDatabaseUrl,
          tenantDatabaseUrl: config.tenantDatabaseUrl,
        }),
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      showToast({
        type: 'success',
        title: t('setup.actions.success'),
        message: `${type === 'both' ? t('common.labels.all') : type === 'core' ? 'Core' : 'Tenant'} ${t('setup.messages.databaseResetSuccess')}`,
      });
      addLog(`${type === 'both' ? t('common.labels.all') : type === 'core' ? 'Core' : 'Tenant'} ${t('setup.messages.databaseResetComplete')}`);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('setup.actions.error'),
        message: t('setup.messages.resetFailed'),
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Load demo modules for modal
  const loadDemoModules = useCallback(async (withStatus: boolean = false) => {
    setLoadingModules(true);
    try {
      const params = new URLSearchParams();
      if (withStatus) {
        params.set('coreDatabaseUrl', config.coreDatabaseUrl);
        params.set('tenantDatabaseUrl', config.tenantDatabaseUrl);
        params.set('tenantSlug', config.tenantSlug);
      }

      const response = await fetch(`/api/setup/demo-modules?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data?.modules) {
        setDemoModules(result.data.modules);
        // Select all modules by default for seeding
        if (!withStatus) {
          setSelectedModules(result.data.modules.map((m: DemoModule) => m.slug));
        } else {
          // For unseeding, only select modules that have data
          setSelectedModules(
            result.data.modules
              .filter((m: DemoModule) => m.hasData)
              .map((m: DemoModule) => m.slug)
          );
        }
      }
    } catch (error) {
      console.error('Error loading demo modules:', error);
      showToast({
        type: 'error',
        title: t('setup.actions.error'),
        message: 'Demo modülleri yüklenemedi',
      });
    } finally {
      setLoadingModules(false);
    }
  }, [config.coreDatabaseUrl, config.tenantDatabaseUrl, config.tenantSlug, t]);

  // Open demo modal
  const openDemoModal = (mode: 'seed' | 'unseed') => {
    setDemoModalMode(mode);
    setDemoModalOpened(true);
    loadDemoModules(mode === 'unseed');
  };

  // Process demo modules (seed or unseed)
  const processDemoModules = async () => {
    if (selectedModules.length === 0) {
      showToast({
        type: 'warning',
        title: t('common.labels.warning'),
        message: 'Lütfen en az bir modül seçin',
      });
      return;
    }

    setProcessingDemo(true);
    const localeLabel = selectedDemoLocale === 'tr' ? 'Türkçe' : selectedDemoLocale === 'en' ? 'İngilizce' : selectedDemoLocale === 'de' ? 'Almanca' : 'Arapça';
    addLog(`Demo ${demoModalMode === 'seed' ? 'veri yükleme' : 'veri silme'} başlatıldı: ${selectedModules.join(', ')}${demoModalMode === 'seed' ? ` (Dil: ${localeLabel})` : ''}`);

    try {
      const response = await fetch('/api/setup/demo-modules', {
        method: demoModalMode === 'seed' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coreDatabaseUrl: config.coreDatabaseUrl,
          tenantDatabaseUrl: config.tenantDatabaseUrl,
          tenantSlug: config.tenantSlug,
          modules: selectedModules,
          locale: demoModalMode === 'seed' ? selectedDemoLocale : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const count = demoModalMode === 'seed' ? result.data.totalCreated : result.data.totalDeleted;
        showToast({
          type: 'success',
          title: t('setup.actions.success'),
          message: demoModalMode === 'seed'
            ? `${count} demo kayıt başarıyla eklendi`
            : `${count} demo kayıt başarıyla silindi`,
        });
        addLog(
          demoModalMode === 'seed'
            ? `Demo veri yükleme tamamlandı: ${count} kayıt eklendi`
            : `Demo veri silme tamamlandı: ${count} kayıt silindi`
        );

        // Update step 8 status if seeding
        if (demoModalMode === 'seed') {
          updateStepStatus(8, {
            status: 'success',
            message: `${count} demo kayıt yüklendi`,
            output: JSON.stringify(result.data.results, null, 2),
          });
        }

        setDemoModalOpened(false);
      } else {
        // Check for detailed errors in data.errors array
        const errorDetails = result.data?.errors?.join('; ') || result.error || 'İşlem başarısız';
        throw new Error(errorDetails);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
      showToast({
        type: 'error',
        title: t('setup.actions.error'),
        message: errorMessage,
      });
      addLog(`Demo işlem hatası: ${errorMessage}`);
    } finally {
      setProcessingDemo(false);
    }
  };

  // Toggle all modules
  const toggleAllModules = () => {
    if (selectedModules.length === demoModules.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(demoModules.map((m) => m.slug));
    }
  };

  // Toggle single module
  const toggleModule = (slug: string) => {
    setSelectedModules((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Production Deploy Functions
  const loadDeploySteps = useCallback(async () => {
    try {
      const response = await fetch('/api/setup/deploy?action=steps');
      const result = await response.json();
      if (result.success && result.data?.steps) {
        setDeploySteps(
          result.data.steps.map((step: { id: string; name: string; description: string; required: boolean }) => ({
            ...step,
            status: 'pending' as const,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading deploy steps:', error);
    }
  }, []);

  const generateScripts = useCallback(async () => {
    setLoadingScripts(true);
    try {
      const params = new URLSearchParams({
        action: 'generate-scripts',
        appName: deployConfig.appName,
        domain: deployConfig.domain,
        branch: deployConfig.branch,
      });
      const response = await fetch(`/api/setup/deploy?${params.toString()}`);
      const result = await response.json();
      if (result.success && result.data) {
        setGeneratedScripts(result.data);
        showToast({
          type: 'success',
          title: t('setup.actions.success'),
          message: 'Deploy scriptleri başarıyla oluşturuldu',
        });
      }
    } catch (error) {
      console.error('Error generating scripts:', error);
      showToast({
        type: 'error',
        title: t('setup.actions.error'),
        message: 'Script oluşturma başarısız',
      });
    } finally {
      setLoadingScripts(false);
    }
  }, [deployConfig.appName, deployConfig.domain, deployConfig.branch, t]);

  const testSSHConnection = async () => {
    if (!serverConfig.host || !serverConfig.username) {
      showToast({
        type: 'warning',
        title: t('common.labels.warning'),
        message: 'Host ve kullanıcı adı gereklidir',
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');
    addLog(`SSH bağlantı testi başlatılıyor: ${serverConfig.username}@${serverConfig.host}:${serverConfig.port}`);

    try {
      const response = await fetch('/api/setup/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-connection',
          serverConfig,
        }),
      });
      const result = await response.json();

      if (result.success) {
        setConnectionStatus('success');
        addLog('SSH bağlantı testi başarılı');
        showToast({
          type: 'success',
          title: t('setup.actions.success'),
          message: 'SSH bağlantısı başarılı',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setConnectionStatus('error');
      addLog(`SSH bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      showToast({
        type: 'error',
        title: t('setup.actions.error'),
        message: error instanceof Error ? error.message : 'Bağlantı başarısız',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load deploy steps on tab change
  useEffect(() => {
    if (activeTab === 'deploy' && deploySteps.length === 0) {
      loadDeploySteps();
    }
  }, [activeTab, deploySteps.length, loadDeploySteps]);

  // Show access denied if not allowed
  if (accessAllowed === false) {
    const requiresAuth = accessError?.includes('giriş') || accessError?.includes('SuperAdmin');

    return (
      <Paper p="xl" shadow="sm" radius="md">
        <Alert icon={<IconAlertCircle size={18} className="tabler-icon tabler-icon-alert-circle" />} title={t('setup.messages.accessDenied')} color="red">
          <Text mb="md">{accessError || t('setup.messages.noAccessPermission')}</Text>
          {requiresAuth ? (
            <Group mt="md">
              <Button
                component="a"
                href="/tr/auth/login?redirect=/tr/setup"
                variant="filled"
                color="blue"
              >
                SuperAdmin Olarak Giriş Yap
              </Button>
            </Group>
          ) : (
            <Text c="dimmed">
              Production ortamında setup sayfasına sadece SuperAdmin erişebilir.
            </Text>
          )}
        </Alert>
      </Paper>
    );
  }

  // Show loading while checking access
  if (accessAllowed === null) {
    return (
      <Paper p="xl" shadow="sm" radius="md">
        <Progress value={100} animated />
        <Text ta="center" mt="md">Erişim kontrol ediliyor...</Text>
      </Paper>
    );
  }

  return (
    <Fragment>
      <Paper p="xl" shadow="sm" radius="md">
        <h1 style={{ marginBottom: '2rem' }}>{t('setup.title')}</h1>

        {/* Main Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
          <Tabs.List>
            <Tabs.Tab value="database" leftSection={<IconDatabase size={16} className="tabler-icon" />}>
              Veritabanı Kurulumu
            </Tabs.Tab>
            <Tabs.Tab value="deploy" leftSection={<IconRocket size={16} className="tabler-icon" />}>
              Production Deploy
            </Tabs.Tab>
            <Tabs.Tab value="security" leftSection={<IconShieldCheck size={16} className="tabler-icon" />}>
              Güvenlik
            </Tabs.Tab>
          </Tabs.List>

          {/* Database Setup Tab */}
          <Tabs.Panel value="database" pt="xl">

        {/* Configuration */}
        <Paper p="md" mb="xl" withBorder>
          <h3 style={{ marginBottom: '1rem' }}>{t('setup.configuration.title')}</h3>
          <TextInput
            label={t('setup.configuration.coreDatabaseUrl')}
            value={config.coreDatabaseUrl}
            onChange={(e) => setConfig({ ...config, coreDatabaseUrl: e.target.value })}
            mb="md"
            disabled={isRunning}
          />
          <TextInput
            label={t('setup.configuration.tenantDatabaseUrl')}
            value={config.tenantDatabaseUrl}
            onChange={(e) => setConfig({ ...config, tenantDatabaseUrl: e.target.value })}
            mb="md"
            disabled={isRunning}
          />
          <TextInput
            label={t('setup.configuration.tenantSlug')}
            value={config.tenantSlug}
            onChange={(e) => setConfig({ ...config, tenantSlug: e.target.value })}
            mb="md"
            disabled={isRunning}
          />
          <Group>
            <Button
              variant="outline"
              color="red"
              onClick={() => resetDatabase('both')}
              disabled={isRunning}
              leftSection={<IconRefresh size={18} className="tabler-icon tabler-icon-refresh" />}
            >
              {t('setup.configuration.resetAll')}
            </Button>
            <Button
              variant="outline"
              color="orange"
              onClick={() => resetDatabase('core')}
              disabled={isRunning}
            >
              {t('setup.configuration.resetCore')}
            </Button>
            <Button
              variant="outline"
              color="orange"
              onClick={() => resetDatabase('tenant')}
              disabled={isRunning}
            >
              {t('setup.configuration.resetTenant')}
            </Button>
            <Divider orientation="vertical" />
            <Button
              variant="filled"
              color="violet"
              onClick={() => openDemoModal('seed')}
              disabled={isRunning}
              leftSection={<IconDatabase size={18} className="tabler-icon tabler-icon-database" />}
            >
              Demo Veri Yükle
            </Button>
            <Button
              variant="outline"
              color="red"
              onClick={() => openDemoModal('unseed')}
              disabled={isRunning}
              leftSection={<IconTrash size={18} className="tabler-icon tabler-icon-trash" />}
            >
              Demo Veri Kaldır
            </Button>
          </Group>
        </Paper>

        {/* Steps Grid - Card Design */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1.5rem',
          width: '100%',
          marginBottom: '2rem'
        }}>
          {STEPS.map((step, index) => {
            const status = stepStatuses[index]?.status;
            const isActive = activeStep === index;
            const isCompleted = status === 'success';
            const isError = status === 'error';
            const isRunning = status === 'running';
            
            return (
              <Card
              key={index}
                shadow="md"
                padding="lg"
                radius="md"
                withBorder
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderColor: isActive ? 'var(--mantine-color-blue-6)' : isCompleted ? 'var(--mantine-color-green-6)' : isError ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-gray-4)',
                  borderWidth: isActive || isCompleted || isError ? '2px' : '1px',
                  backgroundColor: isActive ? 'var(--mantine-color-blue-0)' : isCompleted ? 'var(--mantine-color-green-0)' : isError ? 'var(--mantine-color-red-0)' : 'var(--mantine-color-gray-0)',
                  transform: isActive ? 'translateY(-4px)' : 'none',
                  boxShadow: isActive ? '0 8px 16px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
                onClick={() => setActiveStep(index)}
              >
                <Stack gap="md" align="center">
                  {/* Icon Circle */}
                  <Box
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted ? 'var(--mantine-color-green-6)' : isError ? 'var(--mantine-color-red-6)' : isRunning ? 'var(--mantine-color-blue-6)' : isActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)',
                      color: 'white',
                      fontSize: '28px',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      boxShadow: isActive || isCompleted || isError ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                    }}
                  >
                    {isCompleted ? (
                      <IconCheck size={32} className="tabler-icon tabler-icon-check" />
                    ) : isError ? (
                      <IconX size={32} className="tabler-icon tabler-icon-x" />
                    ) : isRunning ? (
                      <IconRefresh size={32} className="tabler-icon tabler-icon-refresh" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      index + 1
                    )}
                  </Box>

                  {/* Label */}
                  <Title order={4} ta="center" style={{ margin: 0, lineHeight: 1.3 }}>
                    {step.label}
                  </Title>

                  {/* Description */}
                  <Text c="dimmed" ta="center" style={{ minHeight: '40px', lineHeight: 1.5 }}>
                    {step.description}
                  </Text>

                  {/* Status Badge */}
                  {status !== 'pending' && (
                    <Badge
                      color={
                        status === 'success' ? 'green' :
                        status === 'error' ? 'red' :
                        status === 'running' ? 'blue' : 'gray'
                      }
                      variant="light"
                      radius="xl"
                    >
                      {status === 'success' ? t('setup.status.completed') :
                       status === 'error' ? t('setup.status.error') :
                       status === 'running' ? t('setup.status.running') : t('setup.status.pending')}
                    </Badge>
                  )}

                  {/* Action Button */}
                  {isActive && (
                    <Button
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        executeStep(index);
                      }}
                      disabled={isRunning}
                      loading={isRunning}
                      variant={isCompleted ? 'light' : 'filled'}
                      color={isCompleted ? 'green' : 'blue'}
                      radius="md"
                    >
                      {isCompleted ? t('setup.actions.runAgain') : isRunning ? t('setup.status.runningText') : t('setup.actions.runStep')}
                    </Button>
                  )}

                  {/* Next Step Button */}
                  {isCompleted && index < STEPS.length - 1 && isActive && (
                    <Button
                      fullWidth
                      variant="filled"
                      color="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStep(index + 1);
                        executeStep(index + 1);
                      }}
                      disabled={isRunning}
                      radius="md"
                    >
                      {t('setup.actions.nextStep')}
                    </Button>
                  )}

                  {/* Reset Button */}
                  {isError && isActive && (
                    <Button
                      fullWidth
                      variant="outline"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetStep(index);
                      }}
                      disabled={isRunning}
                      radius="md"
                    >
                      {t('setup.actions.resetStep')}
                    </Button>
                  )}
                </Stack>
              </Card>
            );
          })}
        </div>

        {/* Active Step Content */}
        {activeStep >= 0 && (
          <Paper p="lg" mt="xl" withBorder radius="md" shadow="sm">
            <Title order={3} mb="md">
              {STEPS[activeStep]?.label || t('setup.steps.unknown')}
            </Title>
            
            {stepStatuses[activeStep]?.status === 'error' && (
              <Alert icon={<IconAlertCircle size={18} className="tabler-icon tabler-icon-alert-circle" />} title={t('setup.actions.error')} color="red" mb="md" radius="md">
                <p>{stepStatuses[activeStep]?.error}</p>
                {stepStatuses[activeStep]?.solution && (
                      <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    {t('setup.status.solution')} {stepStatuses[activeStep].solution}
                      </p>
                    )}
                  </Alert>
                )}
            
            {stepStatuses[activeStep]?.status === 'success' && (
              <Alert icon={<IconCheck size={18} className="tabler-icon tabler-icon-check" />} title={t('setup.actions.success')} color="green" mb="md" radius="md">
                {stepStatuses[activeStep]?.message}
                  </Alert>
                )}
            
            {stepStatuses[activeStep]?.status === 'running' && (
              <Progress value={100} animated mb="md" radius="md" />
            )}
            
            {stepStatuses[activeStep]?.output && (
              <Paper p="md" mt="md" style={{ maxHeight: '300px', overflow: 'auto' }} radius="md" withBorder>
                <Code block style={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                  {stepStatuses[activeStep]?.output}
                </Code>
              </Paper>
                )}
          </Paper>
        )}

        {/* Actions */}
        <Group justify="space-between" mt="xl">
          <Group>
            <Button
              onClick={() => executeStep(activeStep)}
              disabled={isRunning}
              loading={stepStatuses[activeStep]?.status === 'running'}
            >
              {t('setup.actions.runCurrent')}
            </Button>
            <Button
              onClick={runAllSteps}
              disabled={isRunning}
              variant="filled"
              color="blue"
            >
              {t('setup.actions.runAll')}
            </Button>
            {stepStatuses[activeStep]?.status === 'success' && activeStep < STEPS.length - 1 && (
              <Button
                variant="filled"
                color="green"
                onClick={() => {
                  setActiveStep(activeStep + 1);
                  executeStep(activeStep + 1);
                }}
                disabled={isRunning}
              >
                {t('setup.actions.nextStep')}
            </Button>
            )}
          </Group>
          <Group>
            <Checkbox
              label={t('setup.actions.autoAdvance')}
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.currentTarget.checked)}
              disabled={isRunning}
            />
          <Badge color={isRunning ? 'blue' : 'gray'}>
              {isRunning ? t('setup.status.runningText') : t('setup.status.ready')}
          </Badge>
          </Group>
        </Group>

        {/* Logs */}
        {logs.length > 0 && (
          <Paper p="md" mt="xl" withBorder>
            <h3 style={{ marginBottom: '1rem' }}>{t('setup.logs.title')}</h3>
            <Textarea
              value={logs.join('\n')}
              readOnly
              minRows={10}
              maxRows={20}
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            />
            <Button
              variant="outline"
              mt="sm"
              onClick={() => setLogs([])}
            >
              {t('setup.actions.clearLogs')}
            </Button>
          </Paper>
        )}

          </Tabs.Panel>

          {/* Production Deploy Tab */}
          <Tabs.Panel value="deploy" pt="xl">
            <Stack gap="xl">
              {/* Server Requirements Info */}
              <Alert
                icon={<IconServer size={18} className="tabler-icon" />}
                title="Sunucu Gereksinimleri"
                color="blue"
                variant="light"
              >
                <Text size="sm" mb="xs">
                  <strong>Önerilen:</strong> Hetzner CPX31 (4 vCPU AMD, 8GB RAM, 160GB NVMe SSD)
                </Text>
                <Text size="sm">
                  <strong>Yazılımlar:</strong> Ubuntu 22.04 LTS, Node.js 20.x, PostgreSQL 16, PM2, Nginx, Certbot
                </Text>
              </Alert>

              {/* Server Connection */}
              <Paper p="lg" withBorder radius="md">
                <Group mb="md" justify="space-between">
                  <Group>
                    <ThemeIcon size="lg" variant="light" color="cyan">
                      <IconTerminal size={20} className="tabler-icon" />
                    </ThemeIcon>
                    <Title order={4}>SSH Bağlantısı</Title>
                  </Group>
                  {connectionStatus !== 'idle' && (
                    <Badge
                      color={connectionStatus === 'success' ? 'green' : 'red'}
                      variant="light"
                      size="lg"
                    >
                      {connectionStatus === 'success' ? 'Bağlantı Başarılı' : 'Bağlantı Hatası'}
                    </Badge>
                  )}
                </Group>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <TextInput
                    label="Sunucu IP / Hostname"
                    placeholder="123.45.67.89 veya server.example.com"
                    value={serverConfig.host}
                    onChange={(e) => setServerConfig({ ...serverConfig, host: e.target.value })}
                    leftSection={<IconServer size={16} className="tabler-icon" />}
                  />
                  <NumberInput
                    label="Port"
                    value={serverConfig.port}
                    onChange={(value) => setServerConfig({ ...serverConfig, port: Number(value) || 22 })}
                    min={1}
                    max={65535}
                  />
                  <TextInput
                    label="Kullanıcı Adı"
                    placeholder="root"
                    value={serverConfig.username}
                    onChange={(e) => setServerConfig({ ...serverConfig, username: e.target.value })}
                  />
                  <Select
                    label="Kimlik Doğrulama"
                    value={serverConfig.authMethod}
                    onChange={(value) => setServerConfig({ ...serverConfig, authMethod: (value as 'password' | 'key') || 'key' })}
                    data={[
                      { value: 'key', label: 'SSH Key (Önerilen)' },
                      { value: 'password', label: 'Parola' },
                    ]}
                  />
                </div>

                {serverConfig.authMethod === 'password' ? (
                  <PasswordInput
                    label="Parola"
                    placeholder="SSH parolası"
                    value={serverConfig.password}
                    onChange={(e) => setServerConfig({ ...serverConfig, password: e.target.value })}
                    mt="md"
                  />
                ) : (
                  <Textarea
                    label="SSH Private Key"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                    value={serverConfig.privateKey}
                    onChange={(e) => setServerConfig({ ...serverConfig, privateKey: e.target.value })}
                    minRows={4}
                    maxRows={8}
                    mt="md"
                    styles={{ input: { fontFamily: 'monospace', fontSize: '0.75rem' } }}
                  />
                )}

                <Button
                  mt="lg"
                  onClick={testSSHConnection}
                  loading={testingConnection}
                  leftSection={<IconKey size={16} className="tabler-icon" />}
                  variant="filled"
                  color="cyan"
                >
                  Bağlantıyı Test Et
                </Button>
              </Paper>

              {/* Application Configuration */}
              <Paper p="lg" withBorder radius="md">
                <Group mb="md">
                  <ThemeIcon size="lg" variant="light" color="violet">
                    <IconSettings size={20} className="tabler-icon" />
                  </ThemeIcon>
                  <Title order={4}>Uygulama Yapılandırması</Title>
                </Group>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <TextInput
                    label="Uygulama Adı"
                    placeholder="omnex-app"
                    value={deployConfig.appName}
                    onChange={(e) => setDeployConfig({ ...deployConfig, appName: e.target.value })}
                  />
                  <TextInput
                    label="Domain"
                    placeholder="app.example.com"
                    value={deployConfig.domain}
                    onChange={(e) => setDeployConfig({ ...deployConfig, domain: e.target.value })}
                    leftSection={<IconWorld size={16} className="tabler-icon" />}
                  />
                  <TextInput
                    label="GitHub Repository URL"
                    placeholder="https://github.com/username/repo.git"
                    value={deployConfig.repoUrl}
                    onChange={(e) => setDeployConfig({ ...deployConfig, repoUrl: e.target.value })}
                    leftSection={<IconBrandGithub size={16} className="tabler-icon" />}
                  />
                  <TextInput
                    label="Branch"
                    placeholder="main"
                    value={deployConfig.branch}
                    onChange={(e) => setDeployConfig({ ...deployConfig, branch: e.target.value })}
                  />
                  <Select
                    label="Node.js Sürümü"
                    value={deployConfig.nodeVersion}
                    onChange={(value) => setDeployConfig({ ...deployConfig, nodeVersion: value || '20' })}
                    data={[
                      { value: '20', label: 'Node.js 20.x LTS (Önerilen)' },
                      { value: '18', label: 'Node.js 18.x LTS' },
                    ]}
                  />
                  <NumberInput
                    label="PM2 Instance Sayısı"
                    value={deployConfig.pm2Instances}
                    onChange={(value) => setDeployConfig({ ...deployConfig, pm2Instances: Number(value) || 4 })}
                    min={1}
                    max={16}
                    description="CPX31 için önerilen: 4"
                  />
                </div>

                <Checkbox
                  label="SSL Sertifikası Kur (Let's Encrypt)"
                  checked={deployConfig.enableSsl}
                  onChange={(e) => setDeployConfig({ ...deployConfig, enableSsl: e.currentTarget.checked })}
                  mt="md"
                />
              </Paper>

              {/* Database Configuration */}
              <Paper p="lg" withBorder radius="md">
                <Group mb="md">
                  <ThemeIcon size="lg" variant="light" color="green">
                    <IconDatabase size={20} className="tabler-icon" />
                  </ThemeIcon>
                  <Title order={4}>Veritabanı Yapılandırması</Title>
                </Group>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <TextInput
                    label="Database Host"
                    placeholder="localhost"
                    value={deployConfig.databaseHost}
                    onChange={(e) => setDeployConfig({ ...deployConfig, databaseHost: e.target.value })}
                  />
                  <NumberInput
                    label="Database Port"
                    value={deployConfig.databasePort}
                    onChange={(value) => setDeployConfig({ ...deployConfig, databasePort: Number(value) || 5432 })}
                    min={1}
                    max={65535}
                  />
                  <TextInput
                    label="Database Adı"
                    placeholder="tenant_omnexcore_2025"
                    value={deployConfig.databaseName}
                    onChange={(e) => setDeployConfig({ ...deployConfig, databaseName: e.target.value })}
                  />
                  <TextInput
                    label="Database Kullanıcısı"
                    placeholder="omnex_user"
                    value={deployConfig.databaseUser}
                    onChange={(e) => setDeployConfig({ ...deployConfig, databaseUser: e.target.value })}
                  />
                  <PasswordInput
                    label="Database Parolası"
                    placeholder="Güçlü bir parola girin"
                    value={deployConfig.databasePassword}
                    onChange={(e) => setDeployConfig({ ...deployConfig, databasePassword: e.target.value })}
                    style={{ gridColumn: 'span 2' }}
                  />
                </div>
              </Paper>

              {/* Generate Scripts */}
              <Paper p="lg" withBorder radius="md">
                <Group mb="md" justify="space-between">
                  <Group>
                    <ThemeIcon size="lg" variant="light" color="orange">
                      <IconFileCode size={20} className="tabler-icon" />
                    </ThemeIcon>
                    <Title order={4}>Deploy Scriptleri</Title>
                  </Group>
                  <Button
                    onClick={generateScripts}
                    loading={loadingScripts}
                    leftSection={<IconRocket size={16} className="tabler-icon" />}
                    variant="filled"
                    color="orange"
                    disabled={!deployConfig.appName || !deployConfig.domain}
                  >
                    Scriptleri Oluştur
                  </Button>
                </Group>

                {!deployConfig.appName || !deployConfig.domain ? (
                  <Alert color="yellow" variant="light">
                    Script oluşturmak için uygulama adı ve domain bilgisi gereklidir.
                  </Alert>
                ) : null}

                {generatedScripts && (
                  <Stack gap="md" mt="md">
                    {/* Deploy Script */}
                    <Paper p="md" withBorder radius="md" style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}>
                      <Group justify="space-between" mb="sm">
                        <Group>
                          <IconTerminal size={18} className="tabler-icon" style={{ color: 'var(--mantine-color-green-5)' }} />
                          <Text fw={600} c="white">deploy.sh</Text>
                        </Group>
                        <Group gap="xs">
                          <CopyButton value={generatedScripts.deployScript}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? 'Kopyalandı!' : 'Kopyala'}>
                                <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
                                  <IconCopy size={16} className="tabler-icon" />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                          <Tooltip label="İndir">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => downloadScript(generatedScripts.deployScript, 'deploy.sh')}
                            >
                              <IconDownload size={16} className="tabler-icon" />
                            </ActionIcon>
                          </Tooltip>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => setExpandedScript(expandedScript === 'deploy' ? null : 'deploy')}
                          >
                            {expandedScript === 'deploy' ? <IconChevronUp size={16} className="tabler-icon" /> : <IconChevronDown size={16} className="tabler-icon" />}
                          </ActionIcon>
                        </Group>
                      </Group>
                      <Collapse in={expandedScript === 'deploy'}>
                        <ScrollArea h={300}>
                          <Code block style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                            {generatedScripts.deployScript}
                          </Code>
                        </ScrollArea>
                      </Collapse>
                    </Paper>

                    {/* Ecosystem Config */}
                    <Paper p="md" withBorder radius="md" style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}>
                      <Group justify="space-between" mb="sm">
                        <Group>
                          <IconSettings size={18} className="tabler-icon" style={{ color: 'var(--mantine-color-blue-5)' }} />
                          <Text fw={600} c="white">ecosystem.config.js</Text>
                        </Group>
                        <Group gap="xs">
                          <CopyButton value={generatedScripts.ecosystemConfig}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? 'Kopyalandı!' : 'Kopyala'}>
                                <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
                                  <IconCopy size={16} className="tabler-icon" />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                          <Tooltip label="İndir">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => downloadScript(generatedScripts.ecosystemConfig, 'ecosystem.config.js')}
                            >
                              <IconDownload size={16} className="tabler-icon" />
                            </ActionIcon>
                          </Tooltip>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => setExpandedScript(expandedScript === 'ecosystem' ? null : 'ecosystem')}
                          >
                            {expandedScript === 'ecosystem' ? <IconChevronUp size={16} className="tabler-icon" /> : <IconChevronDown size={16} className="tabler-icon" />}
                          </ActionIcon>
                        </Group>
                      </Group>
                      <Collapse in={expandedScript === 'ecosystem'}>
                        <ScrollArea h={300}>
                          <Code block style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                            {generatedScripts.ecosystemConfig}
                          </Code>
                        </ScrollArea>
                      </Collapse>
                    </Paper>

                    {/* Nginx Config */}
                    <Paper p="md" withBorder radius="md" style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}>
                      <Group justify="space-between" mb="sm">
                        <Group>
                          <IconNetwork size={18} className="tabler-icon" style={{ color: 'var(--mantine-color-green-5)' }} />
                          <Text fw={600} c="white">nginx.conf</Text>
                        </Group>
                        <Group gap="xs">
                          <CopyButton value={generatedScripts.nginxConfig}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? 'Kopyalandı!' : 'Kopyala'}>
                                <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
                                  <IconCopy size={16} className="tabler-icon" />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                          <Tooltip label="İndir">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => downloadScript(generatedScripts.nginxConfig, `${deployConfig.appName}.nginx.conf`)}
                            >
                              <IconDownload size={16} className="tabler-icon" />
                            </ActionIcon>
                          </Tooltip>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => setExpandedScript(expandedScript === 'nginx' ? null : 'nginx')}
                          >
                            {expandedScript === 'nginx' ? <IconChevronUp size={16} className="tabler-icon" /> : <IconChevronDown size={16} className="tabler-icon" />}
                          </ActionIcon>
                        </Group>
                      </Group>
                      <Collapse in={expandedScript === 'nginx'}>
                        <ScrollArea h={300}>
                          <Code block style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                            {generatedScripts.nginxConfig}
                          </Code>
                        </ScrollArea>
                      </Collapse>
                    </Paper>

                    {/* GitHub Actions */}
                    <Paper p="md" withBorder radius="md" style={{ backgroundColor: 'var(--mantine-color-dark-7)' }}>
                      <Group justify="space-between" mb="sm">
                        <Group>
                          <IconBrandGithub size={18} className="tabler-icon" style={{ color: 'var(--mantine-color-white)' }} />
                          <Text fw={600} c="white">.github/workflows/deploy.yml</Text>
                        </Group>
                        <Group gap="xs">
                          <CopyButton value={generatedScripts.githubWorkflow}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? 'Kopyalandı!' : 'Kopyala'}>
                                <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
                                  <IconCopy size={16} className="tabler-icon" />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                          <Tooltip label="İndir">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => downloadScript(generatedScripts.githubWorkflow, 'deploy.yml')}
                            >
                              <IconDownload size={16} className="tabler-icon" />
                            </ActionIcon>
                          </Tooltip>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => setExpandedScript(expandedScript === 'github' ? null : 'github')}
                          >
                            {expandedScript === 'github' ? <IconChevronUp size={16} className="tabler-icon" /> : <IconChevronDown size={16} className="tabler-icon" />}
                          </ActionIcon>
                        </Group>
                      </Group>
                      <Collapse in={expandedScript === 'github'}>
                        <ScrollArea h={300}>
                          <Code block style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                            {generatedScripts.githubWorkflow}
                          </Code>
                        </ScrollArea>
                      </Collapse>
                    </Paper>
                  </Stack>
                )}
              </Paper>

              {/* Deploy Steps */}
              <Paper p="lg" withBorder radius="md">
                <Group mb="md">
                  <ThemeIcon size="lg" variant="light" color="teal">
                    <IconRocket size={20} className="tabler-icon" />
                  </ThemeIcon>
                  <Title order={4}>Deploy Adımları</Title>
                </Group>

                <Alert color="blue" variant="light" mb="md">
                  <Text size="sm">
                    Aşağıdaki adımlar sunucunuzda sırayla çalıştırılmalıdır.
                    SSH bağlantısı kurulduktan sonra &quot;Tüm Adımları Çalıştır&quot; butonuyla otomatik kurulum yapabilirsiniz.
                  </Text>
                </Alert>

                <Stack gap="sm">
                  {deploySteps.map((step, index) => (
                    <Paper
                      key={step.id}
                      p="sm"
                      withBorder
                      radius="md"
                      style={{
                        borderColor:
                          step.status === 'success'
                            ? 'var(--mantine-color-green-5)'
                            : step.status === 'error'
                            ? 'var(--mantine-color-red-5)'
                            : step.status === 'running'
                            ? 'var(--mantine-color-blue-5)'
                            : 'var(--mantine-color-gray-4)',
                      }}
                    >
                      <Group justify="space-between">
                        <Group>
                          <Box
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor:
                                step.status === 'success'
                                  ? 'var(--mantine-color-green-6)'
                                  : step.status === 'error'
                                  ? 'var(--mantine-color-red-6)'
                                  : step.status === 'running'
                                  ? 'var(--mantine-color-blue-6)'
                                  : 'var(--mantine-color-gray-5)',
                              color: 'white',
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {step.status === 'success' ? (
                              <IconCheck size={16} className="tabler-icon" />
                            ) : step.status === 'error' ? (
                              <IconX size={16} className="tabler-icon" />
                            ) : step.status === 'running' ? (
                              <IconRefresh size={16} className="tabler-icon" style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              index + 1
                            )}
                          </Box>
                          <div>
                            <Text fw={500}>{step.name}</Text>
                            <Text size="xs" c="dimmed">
                              {step.description}
                            </Text>
                          </div>
                        </Group>
                        {step.required && (
                          <Badge size="xs" variant="light" color="red">
                            Zorunlu
                          </Badge>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </Stack>

                {deploySteps.length > 0 && (
                  <Group mt="lg">
                    <Button
                      variant="filled"
                      color="teal"
                      leftSection={<IconRocket size={16} className="tabler-icon" />}
                      disabled={connectionStatus !== 'success'}
                    >
                      Tüm Adımları Çalıştır
                    </Button>
                    <Text size="sm" c="dimmed">
                      {connectionStatus !== 'success' && 'Önce SSH bağlantısı kurulmalıdır'}
                    </Text>
                  </Group>
                )}
              </Paper>

              {/* Logs for Deploy */}
              {logs.length > 0 && (
                <Paper p="md" withBorder>
                  <h3 style={{ marginBottom: '1rem' }}>{t('setup.logs.title')}</h3>
                  <Textarea
                    value={logs.join('\n')}
                    readOnly
                    minRows={10}
                    maxRows={20}
                    style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                  <Button variant="outline" mt="sm" onClick={() => setLogs([])}>
                    {t('setup.actions.clearLogs')}
                  </Button>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Security Tab */}
          <Tabs.Panel value="security" pt="xl">
            <SecurityAuditPanel />
          </Tabs.Panel>
        </Tabs>
      </Paper>

      {/* Completion Modal */}
      <Modal
        opened={completionModalOpened}
        onClose={() => {
          setCompletionModalOpened(false);
        }}
        title={t('setup.completion.title')}
        centered
        closeOnClickOutside={true}
        closeOnEscape={true}
        withCloseButton={true}
        trapFocus={true}
        returnFocus={true}
        keepMounted={false}
      >
        <Stack gap="md">
          <Alert icon={<IconCheck size={18} className="tabler-icon tabler-icon-check" />} title={t('setup.actions.success')} color="green">
            {t('setup.completion.message')}
          </Alert>
          
          <Paper p="md" withBorder>
            <Title order={4} mb="md">{t('setup.completion.stepsTitle')}</Title>
            <Stack gap="md">
              {STEPS.map((step, index) => {
                const status = stepStatuses[index];
                return (
                  <Paper key={index} p="sm" withBorder style={{ backgroundColor: status?.status === 'success' ? 'var(--mantine-color-green-0)' : status?.status === 'error' ? 'var(--mantine-color-red-0)' : 'var(--mantine-color-gray-0)' }}>
                    <Group justify="space-between" mb="xs">
                      <Text fw={600}>{index + 1}. {step.label}</Text>
                      {status?.status === 'success' && (
                        <IconCheck size={18} color="green" className="tabler-icon tabler-icon-check" />
                      )}
                      {status?.status === 'error' && (
                        <IconX size={18} color="red" className="tabler-icon tabler-icon-x" />
                      )}
                    </Group>
                    <Text c="dimmed" mb="xs">{step.description}</Text>
                    {status?.message && (
                      <Alert icon={<IconCheck size={14} className="tabler-icon tabler-icon-check" />} color="green" radius="sm" mb="xs">
                        <Text>{status?.message}</Text>
                      </Alert>
                    )}
                    {status?.error && (
                      <Alert icon={<IconAlertCircle size={14} className="tabler-icon tabler-icon-alert-circle" />} color="red" radius="sm" mb="xs">
                        <Text>{status?.error}</Text>
                        {status?.solution && (
                          <Text fw={600} mt="xs">{t('setup.status.solution')} {status?.solution}</Text>
                        )}
                      </Alert>
                    )}
                    {status?.output && (
                      <Code block style={{ maxHeight: '150px', overflow: 'auto', fontSize: '0.7rem' }}>
                        {status?.output}
                      </Code>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          </Paper>

          <Group>
            <Button
              leftSection={<IconDownload size={18} className="tabler-icon tabler-icon-download" />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                generateReport('md');
              }}
              variant="filled"
              type="button"
            >
              {t('setup.completion.downloadMarkdown')}
            </Button>
            <Button
              leftSection={<IconDownload size={18} className="tabler-icon tabler-icon-download" />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                generateReport('txt');
              }}
              variant="outline"
              type="button"
            >
              {t('setup.completion.downloadText')}
            </Button>
          </Group>

          <Text c="dimmed">
            {t('setup.completion.reportDescription')}
          </Text>
        </Stack>
      </Modal>

      {/* Demo Modules Modal */}
      <Modal
        opened={demoModalOpened}
        onClose={() => !processingDemo && setDemoModalOpened(false)}
        title={
          <Group gap="sm">
            <ThemeIcon
              size="lg"
              variant="light"
              color={demoModalMode === 'seed' ? 'violet' : 'red'}
            >
              {demoModalMode === 'seed' ? (
                <IconDatabase size={20} className="tabler-icon tabler-icon-database" />
              ) : (
                <IconTrash size={20} className="tabler-icon tabler-icon-trash" />
              )}
            </ThemeIcon>
            <Title order={4}>
              {demoModalMode === 'seed' ? 'Demo Verileri Yükle' : 'Demo Verileri Kaldır'}
            </Title>
          </Group>
        }
        centered
        size="lg"
        closeOnClickOutside={!processingDemo}
        closeOnEscape={!processingDemo}
      >
        <Stack gap="md">
          {demoModalMode === 'unseed' && (
            <Alert
              icon={<IconAlertCircle size={16} className="tabler-icon tabler-icon-alert-circle" />}
              color="orange"
              variant="light"
            >
              Bu işlem geri alınamaz. Seçilen modüllere ait demo veriler kalıcı olarak silinecektir.
            </Alert>
          )}

          {demoModalMode === 'seed' && (
            <>
              <Alert
                icon={<IconDatabase size={16} className="tabler-icon tabler-icon-database" />}
                color="blue"
                variant="light"
              >
                Demo veriler [DEMO] etiketi ile işaretlenir ve gerçek verilerinizi etkilemez.
                Bağımlılık gerektiren modüller otomatik olarak gerekli verileri de yükler.
              </Alert>

              <Select
                label="Demo Veri Dili"
                description="Demo veriler seçtiğiniz dilde yüklenecektir. Para birimi Ayarlar sayfasından ayrıca belirlenir."
                value={selectedDemoLocale}
                onChange={(value) => setSelectedDemoLocale(value || 'tr')}
                data={[
                  { value: 'tr', label: '🇹🇷 Türkçe' },
                  { value: 'en', label: '🇺🇸 English' },
                  { value: 'de', label: '🇩🇪 Deutsch' },
                  { value: 'ar', label: '🇸🇦 العربية' },
                ]}
                disabled={processingDemo}
              />
            </>
          )}

          <Divider label="Modülleri Seçin" labelPosition="center" />

          {loadingModules ? (
            <Stack align="center" py="xl">
              <Loader size="md" />
              <Text c="dimmed">Modüller yükleniyor...</Text>
            </Stack>
          ) : (
            <>
              <Checkbox
                label={
                  <Text fw={600}>
                    Tümünü Seç ({selectedModules.length}/{demoModules.length})
                  </Text>
                }
                checked={selectedModules.length === demoModules.length && demoModules.length > 0}
                indeterminate={
                  selectedModules.length > 0 && selectedModules.length < demoModules.length
                }
                onChange={toggleAllModules}
                disabled={processingDemo}
              />

              <Divider />

              <ScrollArea h={350} offsetScrollbars>
                <Stack gap="xs">
                  {demoModules.map((module) => (
                    <Paper key={module.slug} p="sm" withBorder radius="md">
                      <Group justify="space-between" wrap="nowrap">
                        <Checkbox
                          label={
                            <Box>
                              <Group gap="xs">
                                <Text fw={500}>{module.name}</Text>
                                {module.dependencies && module.dependencies.length > 0 && (
                                  <Badge size="xs" variant="light" color="gray">
                                    Bağımlı: {module.dependencies.join(', ')}
                                  </Badge>
                                )}
                              </Group>
                              <Text size="xs" c="dimmed">
                                {module.description}
                              </Text>
                            </Box>
                          }
                          checked={selectedModules.includes(module.slug)}
                          onChange={() => toggleModule(module.slug)}
                          disabled={processingDemo || (demoModalMode === 'unseed' && !module.hasData)}
                        />
                        {demoModalMode === 'unseed' && (
                          <Badge
                            variant="light"
                            color={module.hasData ? 'green' : 'gray'}
                            size="sm"
                          >
                            {module.hasData ? `${module.count} kayıt` : 'Veri yok'}
                          </Badge>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea>
            </>
          )}

          <Divider />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setDemoModalOpened(false)}
              disabled={processingDemo}
            >
              İptal
            </Button>
            <Button
              variant="filled"
              color={demoModalMode === 'seed' ? 'violet' : 'red'}
              onClick={processDemoModules}
              loading={processingDemo}
              disabled={loadingModules || selectedModules.length === 0}
              leftSection={
                demoModalMode === 'seed' ? (
                  <IconDatabase size={16} className="tabler-icon tabler-icon-database" />
                ) : (
                  <IconTrash size={16} className="tabler-icon tabler-icon-trash" />
                )
              }
            >
              {demoModalMode === 'seed'
                ? `${selectedModules.length} Modül Yükle`
                : `${selectedModules.length} Modül Kaldır`}
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Fragment>
  );
}

