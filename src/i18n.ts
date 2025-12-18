import { getRequestConfig } from 'next-intl/server';
import { routing } from './lib/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Load global messages
  const globalMessages = (await import(`./locales/global/${locale}.json`)).default;

  // Load module messages dynamically
  // List of all modules that have translations
  const moduleSlugs = [
    'real-estate', 'accounting', 'hr', 'ai', 'production', 'maintenance',
    'file-manager', 'notifications', 'calendar', 'license', 'locations',
    'web-builder', 'sohbet', 'raporlar', 'chat', 'management', 'auth',
    'dashboard', 'permissions', 'roles', 'users', 'settings', 'tenants',
    'menu-management'
  ];

  const moduleMessages: Record<string, any> = {};

  // Load all module translations
  for (const moduleSlug of moduleSlugs) {
    try {
      const moduleMessagesData = (await import(`./locales/modules/${moduleSlug}/${locale}.json`)).default;
      if (moduleMessagesData) {
        if (!moduleMessages.modules) {
          moduleMessages.modules = {};
        }
        moduleMessages.modules[moduleSlug] = moduleMessagesData;
      }
    } catch (error) {
      // Module translation file doesn't exist, skip it
      // Try fallback to default locale if current locale is not default
      if (locale !== routing.defaultLocale) {
        try {
          const fallbackMessages = (await import(`./locales/modules/${moduleSlug}/${routing.defaultLocale}.json`)).default;
          if (fallbackMessages) {
            if (!moduleMessages.modules) {
              moduleMessages.modules = {};
            }
            moduleMessages.modules[moduleSlug] = fallbackMessages;
          }
        } catch {
          // Fallback also failed, skip this module
        }
      }
    }
  }

  // Merge global and module messages
  const messages = {
    ...globalMessages,
    ...moduleMessages
  };

  return {
    locale,
    messages
  };
});

