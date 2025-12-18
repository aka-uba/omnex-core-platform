// Feature Registry
// FAZ 0.4: Merkezi Yetki Yönetimi Sistemi
// Tüm modüllerin ve özelliklerin merkezi kaydı

export const FEATURE_REGISTRY = {
  MODULES: {
    AI: {
      key: 'module.ai',
      name: 'AI Modülü',
      components: {
        TEXT_GENERATOR: 'ai.text.generate',
        IMAGE_GENERATOR: 'ai.image.generate',
        CODE_GENERATOR: 'ai.code.generate',
        AUDIO_GENERATOR: 'ai.audio.generate',
        VIDEO_GENERATOR: 'ai.video.generate',
      },
    },
    ACCOUNTING: {
      key: 'module.accounting',
      name: 'Muhasebe Modülü',
      components: {
        INVOICE_VIEW: 'accounting.invoice.view',
        INVOICE_CREATE: 'accounting.invoice.create',
        INVOICE_EDIT: 'accounting.invoice.edit',
        INVOICE_DELETE: 'accounting.invoice.delete',
        EXPENSE_VIEW: 'accounting.expense.view',
        EXPENSE_CREATE: 'accounting.expense.create',
        EXPENSE_EDIT: 'accounting.expense.edit',
        EXPENSE_DELETE: 'accounting.expense.delete',
      },
    },
    FILE_MANAGER: {
      key: 'module.file-manager',
      name: 'Dosya Yöneticisi',
      components: {
        VIEW: 'file-manager.view',
        UPLOAD: 'file-manager.upload',
        DELETE: 'file-manager.delete',
        SHARE: 'file-manager.share',
      },
    },
    NOTIFICATIONS: {
      key: 'module.notifications',
      name: 'Bildirimler',
      components: {
        VIEW: 'notifications.view',
        CREATE: 'notifications.create',
        SEND: 'notifications.send',
        DELETE: 'notifications.delete',
      },
    },
    HR: {
      key: 'module.hr',
      name: 'İnsan Kaynakları',
      components: {
        EMPLOYEE_VIEW: 'hr.employee.view',
        EMPLOYEE_CREATE: 'hr.employee.create',
        EMPLOYEE_EDIT: 'hr.employee.edit',
        EMPLOYEE_DELETE: 'hr.employee.delete',
      },
    },
    MAINTENANCE: {
      key: 'module.maintenance',
      name: 'Bakım Yönetimi',
      components: {
        REQUEST_VIEW: 'maintenance.request.view',
        REQUEST_CREATE: 'maintenance.request.create',
        REQUEST_EDIT: 'maintenance.request.edit',
        REQUEST_DELETE: 'maintenance.request.delete',
      },
    },
  },
  LAYOUTS: {
    SIDEBAR: {
      EXPANDED: 'layout.sidebar.expanded',
      COLLAPSED: 'layout.sidebar.collapsed',
      HIDDEN: 'layout.sidebar.hidden',
    },
    TOP: {
      NAVBAR: 'layout.top.navbar',
      BREADCRUMBS: 'layout.top.breadcrumbs',
    },
  },
  UI_COMPONENTS: {
    BUTTONS: {
      CREATE: 'ui.button.create',
      EDIT: 'ui.button.edit',
      DELETE: 'ui.button.delete',
      EXPORT: 'ui.button.export',
      IMPORT: 'ui.button.import',
      PRINT: 'ui.button.print',
    },
    ACTIONS: {
      BULK_DELETE: 'ui.action.bulk_delete',
      BULK_EDIT: 'ui.action.bulk_edit',
      BULK_EXPORT: 'ui.action.bulk_export',
    },
  },
  FEATURES: {
    EXPORT: {
      CSV: 'feature.export.csv',
      EXCEL: 'feature.export.excel',
      PDF: 'feature.export.pdf',
      WORD: 'feature.export.word',
    },
    AI: {
      GENERATE: 'feature.ai.generate',
      ANALYZE: 'feature.ai.analyze',
      CHAT: 'feature.ai.chat',
    },
    FILE: {
      UPLOAD: 'feature.file.upload',
      DOWNLOAD: 'feature.file.download',
      SHARE: 'feature.file.share',
    },
  },
} as const;

// Helper function to get all feature keys
export function getAllFeatureKeys(): string[] {
  const keys: string[] = [];

  // Module features
  Object.values(FEATURE_REGISTRY.MODULES).forEach(module => {
    keys.push(module.key);
    Object.values(module.components).forEach(componentKey => {
      keys.push(componentKey);
    });
  });

  // Layout features
  Object.values(FEATURE_REGISTRY.LAYOUTS).forEach(layout => {
    Object.values(layout).forEach(layoutKey => {
      keys.push(layoutKey);
    });
  });

  // UI component features
  Object.values(FEATURE_REGISTRY.UI_COMPONENTS).forEach(component => {
    Object.values(component).forEach(componentKey => {
      keys.push(componentKey);
    });
  });

  // Feature features
  Object.values(FEATURE_REGISTRY.FEATURES).forEach(feature => {
    Object.values(feature).forEach(featureKey => {
      keys.push(featureKey);
    });
  });

  return keys;
}

// Helper function to check if a feature key exists
export function isValidFeatureKey(key: string): boolean {
  return getAllFeatureKeys().includes(key);
}

// Helper function to get feature by key
export function getFeatureByKey(key: string): { key: string; name?: string; category?: string } | null {
  // Search in modules
  for (const module of Object.values(FEATURE_REGISTRY.MODULES)) {
    if (module.key === key) {
      return { key: module.key, name: module.name, category: 'module' };
    }
    for (const [componentName, componentKey] of Object.entries(module.components)) {
      if (componentKey === key) {
        return { key: componentKey, name: componentName, category: 'module' };
      }
    }
  }

  // Search in layouts
  for (const layout of Object.values(FEATURE_REGISTRY.LAYOUTS)) {
    for (const [layoutName, layoutKey] of Object.entries(layout)) {
      if (layoutKey === key) {
        return { key: layoutKey, name: layoutName, category: 'layout' };
      }
    }
  }

  // Search in UI components
  for (const component of Object.values(FEATURE_REGISTRY.UI_COMPONENTS)) {
    for (const [componentName, componentKey] of Object.entries(component)) {
      if (componentKey === key) {
        return { key: componentKey, name: componentName, category: 'ui' };
      }
    }
  }

  // Search in features
  for (const feature of Object.values(FEATURE_REGISTRY.FEATURES)) {
    for (const [featureName, featureKey] of Object.entries(feature)) {
      if (featureKey === key) {
        return { key: featureKey, name: featureName, category: 'feature' };
      }
    }
  }

  return null;
}









