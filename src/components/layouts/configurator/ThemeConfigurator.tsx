/**
 * ThemeConfigurator v2
 * Yeni layout sistemi için tema özelleştirici
 */

'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ActionIcon,
  Group,
  Stack,
  Text,
  Button,
  Slider,
  Switch,
  ScrollArea,
  ColorInput,
  NumberInput,
  Select,
  Tabs,
} from '@mantine/core';
import {
  IconSettings,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconLayoutSidebar,
  IconLayoutNavbar,
  IconDeviceFloppy,
  IconRotateClockwise,
  IconX,
  IconAlignLeft,
  IconAlignRight,
  IconDeviceTablet,
  IconDeviceMobile,
} from '@tabler/icons-react';
import { useLayout } from '../core/LayoutProvider';
import { useNotification } from '@/hooks/useNotification';
import { useMantineColorScheme } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import styles from './ThemeConfigurator.module.css';

function ThemeConfiguratorComponent() {
  const { t } = useTranslation('global');

  // Panel state'ini localStorage'da sakla (layout değiştiğinde korunması için)
  // Hydration hatasını önlemek için ilk render'da her zaman false
  const [opened, setOpened] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Client-side'da mount olduktan sonra localStorage'dan oku

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-configurator-opened');
      if (saved === 'true') {
        // localStorage'dan okuma için setState gerekli - hydration hatasını önlemek için
        setOpened(true);
      }
    }
  }, []);

  const open = () => {
    setOpened(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-configurator-opened', 'true');
    }
  };

  const close = () => {
    setOpened(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-configurator-opened', 'false');
    }
  };
  const [activeTab, setActiveTab] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { showSuccess, showConfirm } = useNotification();
  const { setColorScheme } = useMantineColorScheme();
  const {
    config,
    applyChanges,
    saveConfig,
    isMobile,
  } = useLayout();

  // Debounced applyChanges for Slider - sadece kullanıcı sürüklemeyi bıraktığında uygula
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Partial<any> | null>(null);

  // applyChanges'ı ref ile stabilize et - her render'da yeni referans oluşmasını önle
  const applyChangesRef = useRef(applyChanges);
  useEffect(() => {
    applyChangesRef.current = applyChanges;
  }, [applyChanges]);

  const debouncedApplyChanges = useCallback((changes: Partial<any>, immediate = false) => {
    if (immediate) {
      // Hemen uygula (Switch, Select gibi kontroller için)
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
        sliderTimeoutRef.current = null;
      }
      pendingChangesRef.current = null;
      applyChangesRef.current(changes);
    } else {
      // Debounce et (Slider için)
      pendingChangesRef.current = { ...pendingChangesRef.current, ...changes };

      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }

      sliderTimeoutRef.current = setTimeout(() => {
        if (pendingChangesRef.current) {
          applyChangesRef.current(pendingChangesRef.current);
          pendingChangesRef.current = null;
        }
        sliderTimeoutRef.current = null;
      }, 150); // 150ms debounce - kullanıcı sürüklemeyi bıraktıktan sonra
    }
  }, []); // applyChanges dependency'sini kaldırdık, ref kullanıyoruz

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }
      // Son bekleyen değişiklikleri uygula
      if (pendingChangesRef.current) {
        applyChangesRef.current(pendingChangesRef.current);
      }
    };
  }, []); // applyChanges dependency'sini kaldırdık

  // saveConfig'i ref ile stabilize et
  const saveConfigRef = useRef(saveConfig);
  useEffect(() => {
    saveConfigRef.current = saveConfig;
  }, [saveConfig]);

  const handleSave = useCallback(async () => {
    await saveConfigRef.current('user');
    showSuccess(t('settings.theme.saved'), t('settings.theme.savedMessage'));
    close();
  }, [showSuccess, close, t]);

  const handleReset = useCallback(() => {
    showConfirm(
      t('settings.theme.resetTitle'),
      t('settings.theme.resetConfirm'),
      () => {
        // Reset to defaults - light mode
        setColorScheme('light');
        applyChangesRef.current({
          layoutType: 'sidebar',
          themeMode: 'light',
          direction: 'ltr',
          footerVisible: true,
          sidebar: {
            background: 'light',
            width: 260,
            minWidth: 200,
            maxWidth: 320,
            collapsed: false,
            menuColor: 'auto',
            customMenuColor: '#228be6',
            logoPosition: 'top',
            logoSize: 'medium',
            hoverEffects: true,
          },
          top: {
            background: 'light',
            height: 64,
            scrollBehavior: 'fixed',
            sticky: true,
            menuColor: 'auto',
            customMenuColor: '#228be6',
            logoPosition: 'left',
            logoSize: 'medium',
          },
          mobile: {
            headerHeight: 56,
            iconSize: 24,
            menuAnimation: 'drawer',
            bottomBarVisible: false,
            iconSpacing: 8,
          },
          contentArea: {
            width: { value: 100, unit: '%', min: 320, max: 1920 },
            padding: { top: 24, right: 24, bottom: 24, left: 24 },
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            responsive: {
              mobile: {
                padding: { top: 16, right: 16, bottom: 16, left: 16 },
              },
              tablet: {
                padding: { top: 20, right: 20, bottom: 20, left: 20 },
              },
            },
          },
        });
        showSuccess(t('settings.theme.resetSuccess'), t('settings.theme.resetSuccessMessage'));
      }
    );
  }, [showConfirm, showSuccess, setColorScheme, t]);

  const handleThemeModeChange = useCallback((mode: 'light' | 'dark' | 'auto') => {
    // Config'i güncelle - LayoutProvider'daki useEffect otomatik olarak tema değişikliğini uygulayacak
    applyChangesRef.current({ themeMode: mode });
    // LayoutProvider'daki useEffect auto mode için listener ekleyecek ve tarayıcı tercihini takip edecek
  }, []);

  const handleLayoutChange = useCallback((layoutType: 'sidebar' | 'top', e?: React.MouseEvent) => {
    if (isMobile) {
      // Mobile'da layout değiştirilemez
      return;
    }
    // Event propagation'ı durdur (panel'in kapanmasını önle)
    if (e) {
      e.stopPropagation();
    }
    applyChangesRef.current({ layoutType });
    // Panel kapanmamalı - sadece layout değişmeli
  }, [isMobile]);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={styles.themeCustomizerToggleButton}
        data-testid="theme-configurator-toggle"
        aria-label="Tema ayarlarını aç"
        title="Tema Ayarları"
      >
        <span className={styles.srOnly}>Setting</span>
        <span className={styles.iconWrapper}>
          {mounted && <IconSettings size={24} className={styles.icon} />}
        </span>
      </button>

      {opened && (
        <div
          className={styles.themeCustomizerOverlay}
          onClick={(e) => {
            // Sadece overlay'e direkt tıklanırsa kapat
            if (e.target === e.currentTarget) {
              close();
            }
          }}
        />
      )}
      <div
        className={`${styles.themeCustomizerPanel} ${opened ? '' : styles.closed}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.themeCustomizerHeader}>
          <h5 className={styles.themeCustomizerTitle}>Tema Ayarları</h5>
          <div className={styles.themeCustomizerHeaderActions}>
            <ActionIcon
              variant="subtle"
              onClick={handleSave}
              title="Kaydet"
              size="lg"
            >
              {mounted && <IconDeviceFloppy size={18} />}
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              onClick={handleReset}
              title="Sıfırla"
              size="lg"
            >
              {mounted && <IconRotateClockwise size={18} />}
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              onClick={close}
              title="Kapat"
              size="lg"
            >
              {mounted && <IconX size={18} />}
            </ActionIcon>
          </div>
        </div>

        {/* Content */}
        <ScrollArea {...(styles.themeCustomizerContent ? { className: styles.themeCustomizerContent } : {})}>
          <Stack gap="md">
            {/* Layout Type */}
            {!isMobile && (
              <div className={styles.themeCustomizerSection} suppressHydrationWarning>
                <h6 className={styles.themeCustomizerSectionTitle}>Layout Stili</h6>
                <Group gap="xs">
                  <ActionIcon
                    variant={config.layoutType === 'sidebar' ? 'filled' : 'subtle'}
                    color={config.layoutType === 'sidebar' ? 'blue' : 'gray'}
                    size="xl"
                    onClick={(e) => handleLayoutChange('sidebar', e)}
                    title="Sidebar Layout"
                  >
                    {mounted && <IconLayoutSidebar size={24} />}
                  </ActionIcon>
                  <ActionIcon
                    variant={config.layoutType === 'top' ? 'filled' : 'subtle'}
                    color={config.layoutType === 'top' ? 'blue' : 'gray'}
                    size="xl"
                    onClick={(e) => handleLayoutChange('top', e)}
                    title="Top Layout"
                  >
                    {mounted && <IconLayoutNavbar size={24} />}
                  </ActionIcon>
                </Group>
              </div>
            )}

            {/* Theme Mode */}
            <div className={styles.themeCustomizerSection} suppressHydrationWarning>
              <h6 className={styles.themeCustomizerSectionTitle}>Tema</h6>
              <Group gap="xs">
                <ActionIcon
                  variant={config.themeMode === 'light' ? 'filled' : 'subtle'}
                  color={config.themeMode === 'light' ? 'blue' : 'gray'}
                  size="xl"
                  onClick={() => handleThemeModeChange('light')}
                  title="Açık"
                >
                  {mounted && <IconSun size={24} />}
                </ActionIcon>
                <ActionIcon
                  variant={config.themeMode === 'dark' ? 'filled' : 'subtle'}
                  color={config.themeMode === 'dark' ? 'blue' : 'gray'}
                  size="xl"
                  onClick={() => handleThemeModeChange('dark')}
                  title="Koyu"
                >
                  {mounted && <IconMoon size={24} />}
                </ActionIcon>
                <ActionIcon
                  variant={config.themeMode === 'auto' ? 'filled' : 'subtle'}
                  color={config.themeMode === 'auto' ? 'blue' : 'gray'}
                  size="xl"
                  onClick={() => handleThemeModeChange('auto')}
                  title="Otomatik"
                >
                  {mounted && <IconDeviceDesktop size={24} />}
                </ActionIcon>
              </Group>
            </div>

            {/* Direction */}
            <div className={styles.themeCustomizerSection} suppressHydrationWarning>
              <h6 className={styles.themeCustomizerSectionTitle}>Yön</h6>
              <Group gap="xs">
                <ActionIcon
                  variant={config.direction === 'ltr' ? 'filled' : 'subtle'}
                  color={config.direction === 'ltr' ? 'blue' : 'gray'}
                  size="xl"
                  onClick={() => applyChanges({ direction: 'ltr' })}
                  title="LTR"
                >
                  {mounted && <IconAlignLeft size={24} />}
                </ActionIcon>
                <ActionIcon
                  variant={config.direction === 'rtl' ? 'filled' : 'subtle'}
                  color={config.direction === 'rtl' ? 'blue' : 'gray'}
                  size="xl"
                  onClick={() => applyChanges({ direction: 'rtl' })}
                  title="RTL"
                >
                  {mounted && <IconAlignRight size={24} />}
                </ActionIcon>
              </Group>
            </div>

            {/* Sidebar Config */}
            {config.layoutType === 'sidebar' && config.sidebar && (
              <div className={styles.themeCustomizerSection}>
                <h6 className={styles.themeCustomizerSectionTitle}>Sidebar Ayarları</h6>
                <Stack gap="sm">
                  <div>
                    <Text size="sm" mb="xs">Genişlik: {config.sidebar.width}px</Text>
                    <Slider
                      value={config.sidebar.width}
                      onChange={(value) => debouncedApplyChanges({
                        sidebar: {
                          ...(config.sidebar || {
                            background: 'light',
                            width: 260,
                            collapsed: false,
                            menuColor: 'light'
                          }),
                          width: value
                        }
                      })}
                      min={200}
                      max={320}
                      step={10}
                    />
                  </div>
                  <Switch
                    label="Daraltılmış"
                    checked={config.sidebar.collapsed}
                    onChange={(e) => debouncedApplyChanges({
                      sidebar: {
                        ...(config.sidebar || {
                          background: 'light',
                          width: 260,
                          collapsed: false,
                          menuColor: 'light'
                        }),
                        collapsed: e.currentTarget.checked
                      }
                    }, true)}
                  />
                  <div>
                    <Text size="sm" fw={500} mb="xs">Arka Plan</Text>
                    <div className={`${styles.themeCustomizerOptions} ${styles.fourCols}`}>
                      <div className={styles.cardRadio}>
                        <input
                          type="radio"
                          id="sidebar-bg-light"
                          name="sidebar-background"
                          value="light"
                          checked={config.sidebar.background === 'light'}
                          onChange={() => debouncedApplyChanges({
                            sidebar: {
                              ...(config.sidebar || {
                                background: 'light',
                                width: 260,
                                collapsed: false,
                                menuColor: 'light'
                              }),
                              background: 'light' as const
                            }
                          }, true)}
                          className={styles.cardRadioInput}
                        />
                        <label htmlFor="sidebar-bg-light" className={styles.cardRadioLabel}>
                          <span className={styles.cardRadioIcon}>
                            <span className={styles.colorPreview} style={{ background: '#ffffff', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                          </span>
                          <div className={styles.cardRadioText}>Açık</div>
                        </label>
                      </div>
                      <div className={styles.cardRadio}>
                        <input
                          type="radio"
                          id="sidebar-bg-dark"
                          name="sidebar-background"
                          value="dark"
                          checked={config.sidebar.background === 'dark'}
                          onChange={() => debouncedApplyChanges({
                            sidebar: {
                              ...(config.sidebar || {
                                background: 'light',
                                width: 260,
                                collapsed: false,
                                menuColor: 'light'
                              }),
                              background: 'dark' as const
                            }
                          }, true)}
                          className={styles.cardRadioInput}
                        />
                        <label htmlFor="sidebar-bg-dark" className={styles.cardRadioLabel}>
                          <span className={styles.cardRadioIcon}>
                            <span className={styles.colorPreview} style={{ background: '#1f2937', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                          </span>
                          <div className={styles.cardRadioText}>Koyu</div>
                        </label>
                      </div>
                      <div className={styles.cardRadio}>
                        <input
                          type="radio"
                          id="sidebar-bg-brand"
                          name="sidebar-background"
                          value="brand"
                          checked={config.sidebar.background === 'brand'}
                          onChange={() => debouncedApplyChanges({
                            sidebar: {
                              ...(config.sidebar || {
                                background: 'light',
                                width: 260,
                                collapsed: false,
                                menuColor: 'light'
                              }),
                              background: 'brand' as const
                            }
                          }, true)}
                          className={styles.cardRadioInput}
                        />
                        <label htmlFor="sidebar-bg-brand" className={styles.cardRadioLabel}>
                          <span className={styles.cardRadioIcon}>
                            <span className={styles.colorPreview} style={{ background: '#228be6', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                          </span>
                          <div className={styles.cardRadioText}>Marka</div>
                        </label>
                      </div>
                      <div className={styles.cardRadio}>
                        <input
                          type="radio"
                          id="sidebar-bg-custom"
                          name="sidebar-background"
                          value="custom"
                          checked={config.sidebar.background === 'custom'}
                          onChange={() => debouncedApplyChanges({
                            sidebar: {
                              ...(config.sidebar || {
                                background: 'light',
                                width: 260,
                                collapsed: false,
                                menuColor: 'light'
                              }),
                              background: 'custom' as const
                            }
                          }, true)}
                          className={styles.cardRadioInput}
                        />
                        <label htmlFor="sidebar-bg-custom" className={styles.cardRadioLabel}>
                          <span className={styles.cardRadioIcon}>
                            <span className={styles.colorPreview} style={{ background: config.sidebar?.customColor || '#228be6', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                          </span>
                          <div className={styles.cardRadioText}>Özel</div>
                        </label>
                      </div>
                    </div>
                  </div>
                  {config.sidebar.background === 'custom' && (
                    <div>
                      <Text size="sm" mb="xs">Renk Paleti</Text>
                      <div className={styles.colorPalette}>
                        {['#228be6', '#37b24d', '#fa5252', '#fd7e14', '#fab005', '#7950f2', '#e64980', '#000000', '#ffffff', '#868e96', '#40c057', '#ff6b6b', '#4c6ef5', '#845ef7', '#f06595', '#ffd43b', '#ff922b'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`${styles.colorSwatch} ${(config.sidebar?.customColor || '#228be6') === color ? styles.colorSwatchActive : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => debouncedApplyChanges({
                              sidebar: {
                                ...(config.sidebar || {
                                  background: 'light',
                                  width: 260,
                                  collapsed: false,
                                  menuColor: 'light'
                                }),
                                customColor: color
                              }
                            }, true)}
                            title={color}
                          />
                        ))}
                      </div>
                      <ColorInput
                        label="Özel Renk"
                        value={config.sidebar?.customColor || '#228be6'}
                        onChange={(value) => debouncedApplyChanges({
                          sidebar: {
                            ...(config.sidebar || {
                              background: 'light',
                              width: 260,
                              collapsed: false,
                              menuColor: 'light'
                            }),
                            customColor: value
                          }
                        })}
                        mt="sm"
                      />
                    </div>
                  )}
                </Stack>
              </div>
            )}

            {/* Top Layout Config */}
            {config.layoutType === 'top' && config.top && (
              <div className={styles.themeCustomizerSection}>
                <h6 className={styles.themeCustomizerSectionTitle}>Top Layout Ayarları</h6>
                <Stack gap="sm">
                  <div>
                    <Text size="sm" mb="xs">Yükseklik: {config.top.height}px</Text>
                    <Slider
                      value={config.top.height || 64}
                      onChange={(value) => debouncedApplyChanges({
                        top: {
                          ...(config.top || {
                            background: 'light',
                            scrollBehavior: 'fixed',
                            menuColor: 'light'
                          }),
                          height: value
                        }
                      })}
                      min={48}
                      max={96}
                      step={4}
                    />
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb="xs">Arka Plan</Text>
                    <div className={`${styles.themeCustomizerOptions} ${styles.fourCols}`}>
                      <div className={styles.cardRadio}>
                        <input
                          type="radio"
                          id="top-bg-light"
                          name="top-background"
                          value="light"
                          checked={config.top.background === 'light'}
                          onChange={() => debouncedApplyChanges({
                            top: {
                              ...(config.top || {
                                background: 'light',
                                scrollBehavior: 'fixed',
                                menuColor: 'light'
                              }),
                              background: 'light' as const
                            }
                          }, true)}
                          className={styles.cardRadioInput}
                        />
                        <label htmlFor="top-bg-light" className={styles.cardRadioLabel}>
                          <span className={styles.cardRadioIcon}>
                            <span className={styles.colorPreview} style={{ background: '#ffffff', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                          </span>
                          <div className={styles.cardRadioText}>Açık</div>
                        </label>
                      </div>
                      <div className={styles.cardRadio}>
                        <input
                          type="radio"
                          id="top-bg-dark"
                          name="top-background"
                          value="dark"
                          checked={config.top.background === 'dark'}
                          onChange={() => debouncedApplyChanges({
                            top: {
                              ...(config.top || {
                                background: 'light',
                                scrollBehavior: 'fixed',
                                menuColor: 'light'
                              }),
                              background: 'dark' as const
                            }
                          }, true)}
                          className={styles.cardRadioInput}
                        />
                        <label htmlFor="top-bg-dark" className={styles.cardRadioLabel}>
                          <span className={styles.cardRadioIcon}>
                            <span className={styles.colorPreview} style={{ background: '#1f2937', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                          </span>
                          <div className={styles.cardRadioText}>Koyu</div>
                        </label>
                      </div>
                      <div className={styles.cardRadio}>
                        <input
                          type="radio"
                          id="top-bg-brand"
                          name="top-background"
                          value="brand"
                          checked={config.top.background === 'brand'}
                          onChange={() => debouncedApplyChanges({
                            top: {
                              ...(config.top || {
                                background: 'light',
                                scrollBehavior: 'fixed',
                                menuColor: 'light'
                              }),
                              background: 'brand' as const
                            }
                          }, true)}
                          className={styles.cardRadioInput}
                        />
                        <label htmlFor="top-bg-brand" className={styles.cardRadioLabel}>
                          <span className={styles.cardRadioIcon}>
                            <span className={styles.colorPreview} style={{ background: '#228be6', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                          </span>
                          <div className={styles.cardRadioText}>Marka</div>
                        </label>
                      </div>
                      <div className={styles.cardRadio}>
                        <input
                          type="radio"
                          id="top-bg-custom"
                          name="top-background"
                          value="custom"
                          checked={config.top.background === 'custom'}
                          onChange={() => debouncedApplyChanges({
                            top: {
                              ...(config.top || {
                                background: 'light',
                                scrollBehavior: 'fixed',
                                menuColor: 'light'
                              }),
                              background: 'custom' as const
                            }
                          }, true)}
                          className={styles.cardRadioInput}
                        />
                        <label htmlFor="top-bg-custom" className={styles.cardRadioLabel}>
                          <span className={styles.cardRadioIcon}>
                            <span className={styles.colorPreview} style={{ background: config.top?.customColor || '#228be6', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                          </span>
                          <div className={styles.cardRadioText}>Özel</div>
                        </label>
                      </div>
                    </div>
                  </div>
                  {config.top.background === 'custom' && (
                    <div>
                      <Text size="sm" mb="xs">Renk Paleti</Text>
                      <div className={styles.colorPalette}>
                        {['#228be6', '#37b24d', '#fa5252', '#fd7e14', '#fab005', '#7950f2', '#e64980', '#000000', '#ffffff', '#868e96', '#40c057', '#ff6b6b', '#4c6ef5', '#845ef7', '#f06595', '#ffd43b', '#ff922b'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`${styles.colorSwatch} ${(config.top?.customColor || '#228be6') === color ? styles.colorSwatchActive : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => debouncedApplyChanges({
                              top: {
                                ...(config.top || {
                                  background: 'light',
                                  scrollBehavior: 'fixed',
                                  menuColor: 'light'
                                }),
                                customColor: color
                              }
                            }, true)}
                            title={color}
                          />
                        ))}
                      </div>
                      <ColorInput
                        label="Özel Renk"
                        value={config.top.customColor || '#228be6'}
                        onChange={(value) => debouncedApplyChanges({
                          top: {
                            ...(config.top || {
                              background: 'light',
                              scrollBehavior: 'fixed',
                              menuColor: 'light'
                            }),
                            customColor: value
                          }
                        })}
                        mt="sm"
                      />
                    </div>
                  )}
                  <Select
                    label="Scroll Davranışı"
                    value={config.top.scrollBehavior}
                    onChange={(value) => debouncedApplyChanges({
                      top: {
                        ...(config.top || {
                          background: 'light',
                          scrollBehavior: 'fixed',
                          menuColor: 'light'
                        }),
                        scrollBehavior: (value || 'fixed') as 'fixed' | 'hidden' | 'hidden-on-hover'
                      }
                    }, true)}
                    data={[
                      { value: 'fixed', label: 'Sabit' },
                      { value: 'hidden', label: 'Gizli' },
                      { value: 'hidden-on-hover', label: 'Hover' },
                    ]}
                  />
                </Stack>
              </div>
            )}

            {/* Mobile Config */}
            <div className={styles.themeCustomizerSection}>
              <h6 className={styles.themeCustomizerSectionTitle}>Mobil Ayarları</h6>
              <Stack gap="sm">
                <div>
                  <Text size="sm" mb="xs">Header Yüksekliği: {config.mobile?.headerHeight || 56}px</Text>
                  <Slider
                    value={config.mobile?.headerHeight || 56}
                    onChange={(value) => debouncedApplyChanges({
                      mobile: { ...config.mobile!, headerHeight: value }
                    })}
                    min={48}
                    max={80}
                    step={4}
                  />
                </div>
                <div>
                  <Text size="sm" mb="xs">Icon Boyutu: {config.mobile?.iconSize || 24}px</Text>
                  <Slider
                    value={config.mobile?.iconSize || 24}
                    onChange={(value) => debouncedApplyChanges({
                      mobile: { ...config.mobile!, iconSize: value }
                    })}
                    min={20}
                    max={32}
                    step={2}
                  />
                </div>
              </Stack>
            </div>

            {/* Content Area Config */}
            <div className={styles.themeCustomizerSection}>
              <h6 className={styles.themeCustomizerSectionTitle}>İçerik Alanı</h6>
              <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'desktop' | 'tablet' | 'mobile')}>
                <Tabs.List>
                  <Tabs.Tab value="desktop">
                    {mounted && <IconDeviceDesktop size={18} />}
                  </Tabs.Tab>
                  <Tabs.Tab value="tablet">
                    {mounted && <IconDeviceTablet size={18} />}
                  </Tabs.Tab>
                  <Tabs.Tab value="mobile">
                    {mounted && <IconDeviceMobile size={18} />}
                  </Tabs.Tab>
                </Tabs.List>

                {/* Desktop Tab */}
                <Tabs.Panel value="desktop" pt="sm">
                  <Stack gap="sm">
                    <div>
                      <Text size="sm" mb="xs">Genişlik: {config.contentArea?.width.value || 100}{config.contentArea?.width.unit || '%'}</Text>
                      <Group gap="xs">
                        <NumberInput
                          value={config.contentArea?.width.value || 100}
                          onChange={(value) => {
                            const newValue = Number(value) || 100;
                            const currentUnit = config.contentArea?.width.unit || '%';
                            // Eğer %100 genişlik seçilirse, maxWidth'ı kaldır
                            const shouldRemoveMaxWidth = currentUnit === '%' && newValue === 100;
                            debouncedApplyChanges({
                              contentArea: {
                                ...config.contentArea!,
                                width: {
                                  value: newValue,
                                  unit: config.contentArea!.width?.unit || '%',
                                  min: config.contentArea!.width?.min,
                                  ...(shouldRemoveMaxWidth ? {} : { max: config.contentArea!.width?.max })
                                }
                              }
                            });
                          }}
                          min={0}
                          style={{ flex: 1 }}
                        />
                        <Select
                          value={config.contentArea?.width.unit || '%'}
                          onChange={(value) => {
                            const newUnit = value as 'px' | '%';
                            const currentValue = config.contentArea?.width.value || 100;
                            // Eğer %100 genişlik seçilirse, maxWidth'ı kaldır
                            const shouldRemoveMaxWidth = newUnit === '%' && currentValue === 100;
                            debouncedApplyChanges({
                              contentArea: {
                                ...config.contentArea!,
                                width: {
                                  value: config.contentArea!.width?.value || 100,
                                  unit: newUnit,
                                  min: config.contentArea!.width?.min,
                                  ...(shouldRemoveMaxWidth ? {} : { max: config.contentArea!.width?.max })
                                }
                              }
                            }, true);
                          }}
                          data={[
                            { value: '%', label: '%' },
                            { value: 'px', label: 'px' },
                          ]}
                          style={{ width: 80 }}
                        />
                      </Group>
                      {/* Max Width ayarı */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <Text size="sm" mb="xs">
                          Maksimum Genişlik (px)
                          {(config.contentArea?.width.unit === '%' && config.contentArea?.width.value === 100) && (
                            <Text component="span" size="xs" c="dimmed" ml="xs">
                              (%100 genişlik seçildiğinde otomatik kaldırılır)
                            </Text>
                          )}
                        </Text>
                        <NumberInput
                          {...(config.contentArea?.width.max !== null && config.contentArea?.width.max !== undefined ? { value: config.contentArea.width.max } : {})}
                          onChange={(value) => {
                            const maxValue = value ? Number(value) : undefined;
                            debouncedApplyChanges({
                              contentArea: {
                                ...config.contentArea!,
                                width: {
                                  value: config.contentArea!.width?.value || 100,
                                  unit: config.contentArea!.width?.unit || '%',
                                  min: config.contentArea!.width?.min,
                                  ...(maxValue !== undefined ? { max: maxValue } : {})
                                }
                              }
                            });
                          }}
                          min={0}
                          placeholder="Sınırsız"
                          disabled={config.contentArea?.width.unit === '%' && config.contentArea?.width.value === 100}
                        />
                      </div>
                    </div>
                    <div>
                      <Text size="sm" mb="xs">Padding</Text>
                      <div className={styles.paddingGrid}>
                        <NumberInput
                          label="Üst"
                          value={config.contentArea?.padding.top || 24}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              padding: {
                                top: Number(value) || 24,
                                right: config.contentArea!.padding?.right || 24,
                                bottom: config.contentArea!.padding?.bottom || 24,
                                left: config.contentArea!.padding?.left || 24
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Sağ"
                          value={config.contentArea?.padding.right || 24}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              padding: {
                                top: config.contentArea!.padding?.top || 24,
                                right: Number(value) || 24,
                                bottom: config.contentArea!.padding?.bottom || 24,
                                left: config.contentArea!.padding?.left || 24
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Alt"
                          value={config.contentArea?.padding.bottom || 24}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              padding: {
                                top: config.contentArea!.padding?.top || 24,
                                right: config.contentArea!.padding?.right || 24,
                                bottom: Number(value) || 24,
                                left: config.contentArea!.padding?.left || 24
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Sol"
                          value={config.contentArea?.padding.left || 24}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              padding: {
                                top: config.contentArea!.padding?.top || 24,
                                right: config.contentArea!.padding?.right || 24,
                                bottom: config.contentArea!.padding?.bottom || 24,
                                left: Number(value) || 24
                              }
                            }
                          })}
                          min={0}
                        />
                      </div>
                    </div>
                  </Stack>
                </Tabs.Panel>

                {/* Tablet Tab */}
                <Tabs.Panel value="tablet" pt="sm">
                  <Stack gap="sm">
                    <div>
                      <Text size="sm" mb="xs">Genişlik: {config.contentArea?.responsive?.tablet?.width?.value || config.contentArea?.width.value || 100}{config.contentArea?.responsive?.tablet?.width?.unit || config.contentArea?.width.unit || '%'}</Text>
                      <Group gap="xs">
                        <NumberInput
                          value={config.contentArea?.responsive?.tablet?.width?.value || config.contentArea?.width.value || 100}
                          onChange={(value) => {
                            const newValue = Number(value) || 100;
                            const currentUnit = config.contentArea?.responsive?.tablet?.width?.unit || config.contentArea?.width.unit || '%';
                            const shouldRemoveMaxWidth = currentUnit === '%' && newValue === 100;
                            debouncedApplyChanges({
                              contentArea: {
                                ...config.contentArea!,
                                responsive: {
                                  ...config.contentArea!.responsive,
                                  tablet: {
                                    ...config.contentArea!.responsive?.tablet,
                                    width: {
                                      value: newValue,
                                      unit: config.contentArea!.responsive?.tablet?.width?.unit || '%',
                                      min: config.contentArea!.responsive?.tablet?.width?.min,
                                      ...(shouldRemoveMaxWidth ? {} : { max: config.contentArea!.responsive?.tablet?.width?.max })
                                    }
                                  }
                                }
                              }
                            });
                          }}
                          min={0}
                          style={{ flex: 1 }}
                        />
                        <Select
                          value={config.contentArea?.responsive?.tablet?.width?.unit || config.contentArea?.width.unit || '%'}
                          onChange={(value) => {
                            const newUnit = value as 'px' | '%';
                            const currentValue = config.contentArea?.responsive?.tablet?.width?.value || config.contentArea?.width.value || 100;
                            const shouldRemoveMaxWidth = newUnit === '%' && currentValue === 100;
                            debouncedApplyChanges({
                              contentArea: {
                                ...config.contentArea!,
                                responsive: {
                                  ...config.contentArea!.responsive,
                                  tablet: {
                                    ...config.contentArea!.responsive?.tablet,
                                    width: {
                                      value: config.contentArea!.responsive?.tablet?.width?.value || 100,
                                      unit: newUnit,
                                      min: config.contentArea!.responsive?.tablet?.width?.min,
                                      ...(shouldRemoveMaxWidth ? {} : { max: config.contentArea!.responsive?.tablet?.width?.max })
                                    }
                                  }
                                }
                              }
                            }, true);
                          }}
                          data={[
                            { value: '%', label: '%' },
                            { value: 'px', label: 'px' },
                          ]}
                          style={{ width: 80 }}
                        />
                      </Group>
                    </div>
                    <div>
                      <Text size="sm" mb="xs">Padding</Text>
                      <div className={styles.paddingGrid}>
                        <NumberInput
                          label="Üst"
                          value={config.contentArea?.responsive?.tablet?.padding?.top || config.contentArea?.padding.top || 20}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              responsive: {
                                ...config.contentArea!.responsive,
                                tablet: {
                                  ...config.contentArea!.responsive?.tablet,
                                  padding: {
                                    top: Number(value) || 20,
                                    right: config.contentArea!.responsive?.tablet?.padding?.right || 20,
                                    bottom: config.contentArea!.responsive?.tablet?.padding?.bottom || 20,
                                    left: config.contentArea!.responsive?.tablet?.padding?.left || 20
                                  }
                                }
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Sağ"
                          value={config.contentArea?.responsive?.tablet?.padding?.right || config.contentArea?.padding.right || 20}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              responsive: {
                                ...config.contentArea!.responsive,
                                tablet: {
                                  ...config.contentArea!.responsive?.tablet,
                                  padding: {
                                    top: config.contentArea!.responsive?.tablet?.padding?.top || 20,
                                    right: Number(value) || 20,
                                    bottom: config.contentArea!.responsive?.tablet?.padding?.bottom || 20,
                                    left: config.contentArea!.responsive?.tablet?.padding?.left || 20
                                  }
                                }
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Alt"
                          value={config.contentArea?.responsive?.tablet?.padding?.bottom || config.contentArea?.padding.bottom || 20}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              responsive: {
                                ...config.contentArea!.responsive,
                                tablet: {
                                  ...config.contentArea!.responsive?.tablet,
                                  padding: {
                                    top: config.contentArea!.responsive?.tablet?.padding?.top || 20,
                                    right: config.contentArea!.responsive?.tablet?.padding?.right || 20,
                                    bottom: Number(value) || 20,
                                    left: config.contentArea!.responsive?.tablet?.padding?.left || 20
                                  }
                                }
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Sol"
                          value={config.contentArea?.responsive?.tablet?.padding?.left || config.contentArea?.padding.left || 20}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              responsive: {
                                ...config.contentArea!.responsive,
                                tablet: {
                                  ...config.contentArea!.responsive?.tablet,
                                  padding: {
                                    top: config.contentArea!.responsive?.tablet?.padding?.top || 20,
                                    right: config.contentArea!.responsive?.tablet?.padding?.right || 20,
                                    bottom: config.contentArea!.responsive?.tablet?.padding?.bottom || 20,
                                    left: Number(value) || 20
                                  }
                                }
                              }
                            }
                          })}
                          min={0}
                        />
                      </div>
                    </div>
                  </Stack>
                </Tabs.Panel>

                {/* Mobile Tab */}
                <Tabs.Panel value="mobile" pt="sm">
                  <Stack gap="sm">
                    <div>
                      <Text size="sm" mb="xs">Genişlik: {config.contentArea?.responsive?.mobile?.width?.value || config.contentArea?.width.value || 100}{config.contentArea?.responsive?.mobile?.width?.unit || config.contentArea?.width.unit || '%'}</Text>
                      <Group gap="xs">
                        <NumberInput
                          value={config.contentArea?.responsive?.mobile?.width?.value || config.contentArea?.width.value || 100}
                          onChange={(value) => {
                            const newValue = Number(value) || 100;
                            const currentUnit = config.contentArea?.responsive?.mobile?.width?.unit || config.contentArea?.width.unit || '%';
                            const shouldRemoveMaxWidth = currentUnit === '%' && newValue === 100;
                            debouncedApplyChanges({
                              contentArea: {
                                ...config.contentArea!,
                                responsive: {
                                  ...config.contentArea!.responsive,
                                  mobile: {
                                    ...config.contentArea!.responsive?.mobile,
                                    width: {
                                      value: newValue,
                                      unit: config.contentArea!.responsive?.mobile?.width?.unit || '%',
                                      min: config.contentArea!.responsive?.mobile?.width?.min,
                                      ...(shouldRemoveMaxWidth ? {} : { max: config.contentArea!.responsive?.mobile?.width?.max })
                                    }
                                  }
                                }
                              }
                            });
                          }}
                          min={0}
                          style={{ flex: 1 }}
                        />
                        <Select
                          value={config.contentArea?.responsive?.mobile?.width?.unit || config.contentArea?.width.unit || '%'}
                          onChange={(value) => {
                            const newUnit = value as 'px' | '%';
                            const currentValue = config.contentArea?.responsive?.mobile?.width?.value || config.contentArea?.width.value || 100;
                            const shouldRemoveMaxWidth = newUnit === '%' && currentValue === 100;
                            debouncedApplyChanges({
                              contentArea: {
                                ...config.contentArea!,
                                responsive: {
                                  ...config.contentArea!.responsive,
                                  mobile: {
                                    ...config.contentArea!.responsive?.mobile,
                                    width: {
                                      value: config.contentArea!.responsive?.mobile?.width?.value || 100,
                                      unit: newUnit,
                                      min: config.contentArea!.responsive?.mobile?.width?.min,
                                      ...(shouldRemoveMaxWidth ? {} : { max: config.contentArea!.responsive?.mobile?.width?.max })
                                    }
                                  }
                                }
                              }
                            }, true);
                          }}
                          data={[
                            { value: '%', label: '%' },
                            { value: 'px', label: 'px' },
                          ]}
                          style={{ width: 80 }}
                        />
                      </Group>
                    </div>
                    <div>
                      <Text size="sm" mb="xs">Padding</Text>
                      <div className={styles.paddingGrid}>
                        <NumberInput
                          label="Üst"
                          value={config.contentArea?.responsive?.mobile?.padding?.top || config.contentArea?.padding.top || 16}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              responsive: {
                                ...config.contentArea!.responsive,
                                mobile: {
                                  ...config.contentArea!.responsive?.mobile,
                                  padding: {
                                    top: Number(value) || 16,
                                    right: config.contentArea!.responsive?.mobile?.padding?.right || 16,
                                    bottom: config.contentArea!.responsive?.mobile?.padding?.bottom || 16,
                                    left: config.contentArea!.responsive?.mobile?.padding?.left || 16
                                  }
                                }
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Sağ"
                          value={config.contentArea?.responsive?.mobile?.padding?.right || config.contentArea?.padding.right || 16}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              responsive: {
                                ...config.contentArea!.responsive,
                                mobile: {
                                  ...config.contentArea!.responsive?.mobile,
                                  padding: {
                                    top: config.contentArea!.responsive?.mobile?.padding?.top || 16,
                                    right: Number(value) || 16,
                                    bottom: config.contentArea!.responsive?.mobile?.padding?.bottom || 16,
                                    left: config.contentArea!.responsive?.mobile?.padding?.left || 16
                                  }
                                }
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Alt"
                          value={config.contentArea?.responsive?.mobile?.padding?.bottom || config.contentArea?.padding.bottom || 16}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              responsive: {
                                ...config.contentArea!.responsive,
                                mobile: {
                                  ...config.contentArea!.responsive?.mobile,
                                  padding: {
                                    top: config.contentArea!.responsive?.mobile?.padding?.top || 16,
                                    right: config.contentArea!.responsive?.mobile?.padding?.right || 16,
                                    bottom: Number(value) || 16,
                                    left: config.contentArea!.responsive?.mobile?.padding?.left || 16
                                  }
                                }
                              }
                            }
                          })}
                          min={0}
                        />
                        <NumberInput
                          label="Sol"
                          value={config.contentArea?.responsive?.mobile?.padding?.left || config.contentArea?.padding.left || 16}
                          onChange={(value) => debouncedApplyChanges({
                            contentArea: {
                              ...config.contentArea!,
                              responsive: {
                                ...config.contentArea!.responsive,
                                mobile: {
                                  ...config.contentArea!.responsive?.mobile,
                                  padding: {
                                    top: config.contentArea!.responsive?.mobile?.padding?.top || 16,
                                    right: config.contentArea!.responsive?.mobile?.padding?.right || 16,
                                    bottom: config.contentArea!.responsive?.mobile?.padding?.bottom || 16,
                                    left: Number(value) || 16
                                  }
                                }
                              }
                            }
                          })}
                          min={0}
                        />
                      </div>
                    </div>
                  </Stack>
                </Tabs.Panel>
              </Tabs>
            </div>

            {/* Footer */}
            <div className={styles.themeCustomizerSection}>
              <Switch
                label="Footer Görünür"
                checked={config.footerVisible}
                onChange={(e) => debouncedApplyChanges({ footerVisible: e.currentTarget.checked }, true)}
              />
            </div>
          </Stack>
        </ScrollArea>

        {/* Footer */}
        <div className={styles.themeCustomizerFooter}>
          <Button
            variant="default"
            size="sm"
            leftSection={mounted ? <IconRotateClockwise size={16} /> : null}
            onClick={handleReset}
          >
            Sıfırla
          </Button>
          <Button
            variant="filled"
            size="sm"
            leftSection={mounted ? <IconDeviceFloppy size={16} /> : null}
            onClick={handleSave}
          >
            Kaydet
          </Button>
        </div>
      </div>
    </>
  );
}

// Component'i memoize et - React.memo ile
// useLayout context'i zaten memoize edilmiş, bu yüzden sadece context değiştiğinde render olacak
export const ThemeConfigurator = memo(ThemeConfiguratorComponent);

