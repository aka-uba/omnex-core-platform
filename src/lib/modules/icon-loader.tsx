/**
 * Module Icon Loader
 * Dynamically loads and renders module icons
 */

import { IconApps } from '@tabler/icons-react';
// Try both import methods
import * as TablerIconsNamespace from '@tabler/icons-react';

// Check if TablerIcons has a default export or is a namespace
const TablerIcons = (TablerIconsNamespace as { default?: typeof TablerIconsNamespace }).default || TablerIconsNamespace;

// Helper to check if a value is a valid React component
const isValidReactComponent = (value: unknown): value is React.ComponentType<{ size?: number }> => {
  return typeof value === 'function' ||
    (typeof value === 'object' && value !== null && '$$typeof' in value);
};

// Build a lookup map of all available icons for faster access
// This handles cases where icons exist but aren't directly accessible
const buildIconMap = () => {
  const iconMap = new Map<string, React.ComponentType<{ size?: number }>>();
  const allKeys = Object.keys(TablerIcons);

  for (const key of allKeys) {
    try {
      // Try multiple access methods
      let icon = (TablerIcons as Record<string, unknown>)[key] as React.ComponentType<{ size?: number }> | undefined;

      // If direct access fails, try Reflect.get
      if (!icon || !isValidReactComponent(icon)) {
        try {
          icon = Reflect.get(TablerIcons, key);
        } catch (e) {
          // Skip if can't access
        }
      }

      // If still not found, try getOwnPropertyDescriptor
      if (!icon || !isValidReactComponent(icon)) {
        try {
          const descriptor = Object.getOwnPropertyDescriptor(TablerIcons, key);
          if (descriptor && isValidReactComponent(descriptor.value)) {
            icon = descriptor.value;
          }
        } catch (e) {
          // Skip if can't access
        }
      }

      if (icon && isValidReactComponent(icon)) {
        iconMap.set(key, icon);
        // Also add lowercase version for case-insensitive lookup
        iconMap.set(key.toLowerCase(), icon);
      }
    } catch (e) {
      // Skip if can't access
    }
  }

  return iconMap;
};

// Lazy load icon map for better performance
// Only build when first accessed
let iconMapCache: Map<string, React.ComponentType<{ size?: number }>> | null = null;

function getIconMap(): Map<string, React.ComponentType<{ size?: number }>> {
  if (!iconMapCache) {
    iconMapCache = buildIconMap();
  }
  return iconMapCache;
}

// Icon name mappings for common aliases
const iconNameMappings: Record<string, string[]> = {
  'IconDashboard': ['IconLayoutDashboard', 'IconDashboard', 'IconHome', 'IconHome2'],
  'IconApps': ['IconApps', 'IconAppWindow', 'IconGridDots', 'IconGridPattern'],
  'IconUpload': ['IconUpload', 'IconCloudUpload', 'IconArrowUp'],
  'IconSettings': ['IconSettings', 'IconCog', 'IconAdjustments'],
  'IconMapPin': ['IconMapPin', 'IconMapPinFilled', 'IconLocation'],
  'IconHelp': ['IconHelp', 'IconHelpCircle', 'IconQuestionMark', 'IconInfoCircle'],
  'IconChartBar': ['IconChartBar', 'IconChartBarFilled', 'IconChartBarLine', 'IconChartLine'],
  'IconReport': ['IconReport', 'IconReportAnalytics', 'IconFileText', 'IconFileDescription'],
  'IconUserCircle': ['IconUserCircle', 'IconUser', 'IconUserFilled'],
  'IconUsers': ['IconUsers', 'IconUsersGroup', 'IconUserGroup'],
  'IconShield': ['IconShield', 'IconShieldCheck', 'IconShieldLock'],
  'IconLock': ['IconLock', 'IconLockFilled', 'IconLockOpen'],
  'IconBell': ['IconBell', 'IconBellFilled', 'IconBellRinging'],
  'IconCalendar': ['IconCalendar', 'IconCalendarEvent', 'IconCalendarTime'],
  'IconFolder': ['IconFolder', 'IconFolderFilled', 'IconFolderOpen'],
  'IconBrain': ['IconBrain', 'IconBrainCircuit', 'IconCpu'],
  'IconMessageChatbot': ['IconMessageChatbot', 'IconRobot', 'IconMessageCircle', 'IconMessage'],
  'IconPhoto': ['IconPhoto', 'IconPhotoFilled', 'IconCamera', 'IconImage'],
  'IconCode': ['IconCode', 'IconCodeCircle', 'IconBrackets'],
  'IconMicrophone': ['IconMicrophone', 'IconMicrophone2', 'IconMicrophoneFilled'],
  'IconVideo': ['IconVideo', 'IconVideoFilled', 'IconVideoOff'],
  'IconTable': ['IconTable', 'IconTableFilled', 'IconTableExport'],
  'IconMessageCircle': ['IconMessageCircle', 'IconMessage', 'IconMessageDots'],
  'IconClock': ['IconClock', 'IconClockFilled', 'IconClockHour4'],
  'IconSchool': ['IconSchool', 'IconSchoolFilled', 'IconBook'],
  'IconFileCheck': ['IconFileCheck', 'IconFile', 'IconFileText', 'IconFileDescription'],
  'IconPackage': ['IconPackage', 'IconPackageFilled', 'IconBox'],
  'IconBuildingFactory': ['IconBuildingFactory', 'IconBuilding', 'IconBuildingWarehouse'],
  'IconTruck': ['IconTruck', 'IconTruckDelivery', 'IconTruckReturn'],
  'IconCurrencyDollar': ['IconCurrencyDollar', 'IconCurrencyDollarOff', 'IconDollar'],
  'IconTools': ['IconTools', 'IconTool', 'IconWrench', 'IconHammer'],
  'IconWorld': ['IconWorld', 'IconWorldWww', 'IconGlobe'],
};

interface ModuleIconProps {
  icon?: string;
  iconName?: string; // Alias for icon (for backward compatibility)
  size?: number;
  fallback?: React.ReactNode;
}

export function ModuleIcon({ icon, iconName, size = 20, fallback }: ModuleIconProps) {
  const iconToUse = icon || iconName;
  
  if (!iconToUse) {
    return fallback || <IconApps size={size} />;
  }

  // Eğer icon bir React component ise, direkt render et
  if (typeof iconToUse === 'function' || (typeof iconToUse === 'object' && iconToUse !== null && '$$typeof' in iconToUse)) {
    const IconComponent = iconToUse as React.ComponentType<{ size?: number }>;
    return <IconComponent size={size} />;
  }

  // Eğer string değilse, fallback döndür
  if (typeof iconToUse !== 'string') {
    return fallback || <IconApps size={size} />;
  }

  // Get alternative names from mapping
  const mappedNames = iconNameMappings[iconToUse] || [];
  
  // Try multiple naming patterns
  // 1. If already starts with "Icon", use as-is (e.g., IconDashboard)
  // 2. Icon{Name} (e.g., IconDashboard from "Dashboard")
  // 3. {Name} (e.g., Dashboard)
  // 4. Icon{Name} with first letter capitalized (e.g., IconDashboard from "dashboard")
  // 5. Remove "Icon" prefix if present and try again
  const isAlreadyPrefixed = iconToUse.startsWith('Icon');
  const nameWithoutPrefix = isAlreadyPrefixed ? iconToUse.slice(4) : iconToUse;
  const capitalizedName = nameWithoutPrefix.charAt(0).toUpperCase() + nameWithoutPrefix.slice(1);
  
  const triedNames = [
    ...mappedNames, // Try mapped alternatives first
    iconToUse, // Try as-is first (in case it's already "IconDashboard")
    `Icon${nameWithoutPrefix}`, // IconDashboard from "Dashboard"
    nameWithoutPrefix, // Dashboard
    `Icon${capitalizedName}`, // IconDashboard from "dashboard"
    capitalizedName, // Dashboard from "dashboard"
  ];

  // Remove duplicates
  const uniqueTriedNames = Array.from(new Set(triedNames));

  let IconComponent: React.ComponentType<{ size?: number }> | null = null;

  // Get icon map (lazy loaded)
  const iconMap = getIconMap();
  
  // Try to find the icon component
  for (const name of uniqueTriedNames) {
    // First try the icon map (most reliable)
    if (iconMap.has(name)) {
      IconComponent = iconMap.get(name) || null;
      break;
    }

    // Try direct access
    const directAccess = (TablerIcons as Record<string, unknown>)[name];
    if (directAccess && isValidReactComponent(directAccess)) {
      IconComponent = directAccess;
      break;
    }

    // Try with getOwnPropertyDescriptor (for non-enumerable properties)
    try {
      const descriptor = Object.getOwnPropertyDescriptor(TablerIcons, name);
      if (descriptor && isValidReactComponent(descriptor.value)) {
        IconComponent = descriptor.value;
        break;
      }
    } catch (e) {
      // Skip if can't access
    }

    // Try case-insensitive lookup in the map
    const lowerName = name.toLowerCase();
    if (iconMap.has(lowerName)) {
      IconComponent = iconMap.get(lowerName) || null;
      break;
    }
  }

  if (IconComponent && isValidReactComponent(IconComponent)) {
    return <IconComponent size={size} />;
  }

  // If icon is a string (emoji or text), render as text
  if (typeof icon === 'string' && icon.length <= 2) {
    return <span style={{ fontSize: size }}>{icon}</span>;
  }

  // Fallback to default icon
  return fallback || <IconApps size={size} />;
}






