'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  TextInput,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Paper,
  Text,
  Group,
  Badge,
  ScrollArea,
  Box,
  UnstyledButton,
  Stack,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import * as TablerIcons from '@tabler/icons-react';

// Popular/commonly used icons for quick access
const POPULAR_ICONS = [
  'IconDashboard', 'IconHome', 'IconSettings', 'IconUsers', 'IconUser',
  'IconFolder', 'IconFile', 'IconFileText', 'IconCalendar', 'IconClock',
  'IconMail', 'IconBell', 'IconHeart', 'IconStar', 'IconBookmark',
  'IconSearch', 'IconFilter', 'IconPlus', 'IconEdit', 'IconTrash',
  'IconCheck', 'IconX', 'IconArrowRight', 'IconArrowLeft', 'IconChevronRight',
  'IconDownload', 'IconUpload', 'IconShare', 'IconLink', 'IconExternalLink',
  'IconLock', 'IconShield', 'IconKey', 'IconEye', 'IconEyeOff',
  'IconPhoto', 'IconCamera', 'IconVideo', 'IconMusic', 'IconMicrophone',
  'IconMessage', 'IconMessageCircle', 'IconPhone', 'IconSend', 'IconInbox',
  'IconCart', 'IconShoppingCart', 'IconCreditCard', 'IconReceipt', 'IconWallet',
  'IconBriefcase', 'IconBuilding', 'IconMapPin', 'IconWorld', 'IconGlobe',
  'IconDatabase', 'IconServer', 'IconCloud', 'IconCode', 'IconTerminal',
  'IconChartBar', 'IconChartLine', 'IconChartPie', 'IconReport', 'IconFileAnalytics',
  'IconPackage', 'IconBox', 'IconTruck', 'IconPlane', 'IconCar',
  'IconTools', 'IconWrench', 'IconHammer', 'IconPaint', 'IconPalette',
  'IconCurrencyDollar', 'IconCurrencyEuro', 'IconCurrencyLira', 'IconReceipt2', 'IconCalculator',
  'IconApps', 'IconGridDots', 'IconLayout', 'IconLayoutDashboard', 'IconMenu2',
  'IconBrain', 'IconRobot', 'IconCpu', 'IconDevices', 'IconDeviceDesktop',
  'IconClipboard', 'IconClipboardList', 'IconChecklist', 'IconListCheck', 'IconList',
];

// Category mapping for icons - using search terms that match Tabler icon naming
const ICON_CATEGORIES: Record<string, string[]> = {
  'Navigation': ['Home', 'Dashboard', 'Menu', 'Chevron', 'Arrow', 'Caret', 'Layout', 'Grid', 'Apps'],
  'Files': ['File', 'Folder', 'Document', 'Paper', 'Clipboard', 'Note', 'Book'],
  'Users': ['User', 'Users', 'People', 'Friend', 'Group', 'Man', 'Woman'],
  'Communication': ['Message', 'Mail', 'Phone', 'Chat', 'Send', 'Inbox', 'At', 'Bell'],
  'Media': ['Photo', 'Video', 'Music', 'Camera', 'Image', 'Picture', 'Film', 'Microphone'],
  'Business': ['Briefcase', 'Building', 'Office', 'Currency', 'Receipt', 'Wallet', 'Bank', 'Cash'],
  'Charts': ['Chart', 'Graph', 'Analytics', 'Report', 'Trending', 'Statistics', 'Progress'],
  'Technology': ['Code', 'Database', 'Server', 'Cloud', 'Cpu', 'Device', 'Terminal', 'Api', 'Bug'],
  'Security': ['Lock', 'Shield', 'Key', 'Security', 'Guard', 'Eye', 'Password', 'Fingerprint'],
  'Actions': ['Plus', 'Edit', 'Trash', 'Save', 'Check', 'X', 'Download', 'Upload', 'Refresh', 'Search'],
};

interface IconPickerProps {
  value?: string | undefined;
  onChange: (iconName: string) => void;
  opened: boolean;
  onClose: () => void;
}

export function IconPicker({ value, onChange, opened, onClose }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all icon names from Tabler Icons
  const allIconNames = useMemo(() => {
    return Object.keys(TablerIcons).filter((key) => {
      if (!key.startsWith('Icon')) return false;
      const icon = (TablerIcons as Record<string, unknown>)[key];
      // Icons can be functions OR objects with $$typeof (forwardRef components)
      return typeof icon === 'function' ||
        (typeof icon === 'object' && icon !== null && '$$typeof' in icon);
    });
  }, []);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons = allIconNames;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter((name) => name.toLowerCase().includes(query));
    }

    // Filter by category
    if (selectedCategory && ICON_CATEGORIES[selectedCategory]) {
      const categoryTerms = ICON_CATEGORIES[selectedCategory];
      icons = icons.filter((name) => {
        const iconNameWithoutPrefix = name.replace('Icon', '').toLowerCase();
        return categoryTerms.some((term) => iconNameWithoutPrefix.includes(term.toLowerCase()));
      });
    }

    // Sort: popular icons first, then alphabetically
    return icons.sort((a, b) => {
      const aPopular = POPULAR_ICONS.includes(a);
      const bPopular = POPULAR_ICONS.includes(b);
      if (aPopular && !bPopular) return -1;
      if (!aPopular && bPopular) return 1;
      return a.localeCompare(b);
    });
  }, [allIconNames, searchQuery, selectedCategory]);

  // Render icon by name
  const renderIcon = useCallback((iconName: string, size: number = 24) => {
    const IconComponent = (TablerIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[iconName];
    // Check if it's a valid React component (function or forwardRef object)
    if (IconComponent && (typeof IconComponent === 'function' ||
        (typeof IconComponent === 'object' && '$$typeof' in IconComponent))) {
      return <IconComponent size={size} />;
    }
    return null;
  }, []);

  // Handle icon selection
  const handleSelect = (iconName: string) => {
    // Remove "Icon" prefix for cleaner storage
    const cleanName = iconName.startsWith('Icon') ? iconName.slice(4) : iconName;
    onChange(cleanName);
    onClose();
  };

  // Current selected icon display name
  const currentIconName = value ? (value.startsWith('Icon') ? value : `Icon${value}`) : null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="İkon Seç"
      size="xl"
    >
      <Stack gap="md">
        {/* Current Selection */}
        {currentIconName && (
          <Paper p="sm" withBorder radius="md" bg="var(--mantine-color-blue-light)">
            <Group justify="space-between">
              <Group gap="sm">
                <Text size="sm" fw={500}>Seçili İkon:</Text>
                <Group gap="xs">
                  {renderIcon(currentIconName, 20)}
                  <Text size="sm">{value}</Text>
                </Group>
              </Group>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => {
                  onChange('');
                  onClose();
                }}
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Paper>
        )}

        {/* Search */}
        <TextInput
          placeholder="İkon ara... (örn: dashboard, user, settings)"
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          rightSection={
            searchQuery && (
              <ActionIcon variant="subtle" size="sm" onClick={() => setSearchQuery('')}>
                <IconX size={14} />
              </ActionIcon>
            )
          }
        />

        {/* Categories */}
        <ScrollArea>
          <Group gap="xs" wrap="nowrap">
            <Badge
              variant={selectedCategory === null ? 'filled' : 'light'}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedCategory(null)}
            >
              Tümü
            </Badge>
            <Badge
              variant={selectedCategory === 'popular' ? 'filled' : 'light'}
              color="orange"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedCategory('popular')}
            >
              Popüler
            </Badge>
            {Object.keys(ICON_CATEGORIES).map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'filled' : 'light'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </Group>
        </ScrollArea>

        {/* Icons Grid */}
        <ScrollArea h={400}>
          <Text size="xs" c="dimmed" mb="xs">
            {filteredIcons.length} ikon bulundu
          </Text>
          <SimpleGrid cols={8} spacing="xs">
            {(selectedCategory === 'popular' ? POPULAR_ICONS : filteredIcons.slice(0, 200)).map((iconName) => {
              const isSelected = currentIconName === iconName;
              return (
                <Tooltip key={iconName} label={iconName.replace('Icon', '')} withArrow>
                  <UnstyledButton
                    onClick={() => handleSelect(iconName)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '2px solid var(--mantine-color-blue-6)'
                        : '1px solid var(--mantine-color-gray-3)',
                      backgroundColor: isSelected
                        ? 'var(--mantine-color-blue-light)'
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {renderIcon(iconName, 22)}
                  </UnstyledButton>
                </Tooltip>
              );
            })}
          </SimpleGrid>
          {filteredIcons.length > 200 && (
            <Text size="xs" c="dimmed" mt="md" ta="center">
              İlk 200 ikon gösteriliyor. Daha fazlası için arama yapın.
            </Text>
          )}
        </ScrollArea>
      </Stack>
    </Modal>
  );
}

// Compact icon picker button component
interface IconPickerButtonProps {
  value?: string;
  onChange: (iconName: string) => void;
  label?: string;
  placeholder?: string;
}

export function IconPickerButton({ value, onChange, label, placeholder }: IconPickerButtonProps) {
  const [opened, setOpened] = useState(false);

  // Render current icon
  const currentIconName = value ? (value.startsWith('Icon') ? value : `Icon${value}`) : null;
  const iconCandidate = currentIconName
    ? (TablerIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[currentIconName]
    : null;
  // Check if it's a valid React component (function or forwardRef object)
  const IconComponent = iconCandidate && (typeof iconCandidate === 'function' ||
    (typeof iconCandidate === 'object' && '$$typeof' in iconCandidate))
    ? iconCandidate
    : null;

  return (
    <>
      <Box>
        {label && (
          <Text size="sm" fw={500} mb={4}>
            {label}
          </Text>
        )}
        <UnstyledButton
          onClick={() => setOpened(true)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid var(--mantine-color-gray-4)',
            backgroundColor: 'var(--mantine-color-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {IconComponent ? (
            <>
              <IconComponent size={20} />
              <Text size="sm">{value}</Text>
            </>
          ) : (
            <Text size="sm" c="dimmed">
              {placeholder || 'İkon seçin...'}
            </Text>
          )}
        </UnstyledButton>
      </Box>

      <IconPicker
        value={value}
        onChange={onChange}
        opened={opened}
        onClose={() => setOpened(false)}
      />
    </>
  );
}
