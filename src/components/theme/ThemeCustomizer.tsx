'use client';

import {
    ActionIcon,
    Button,
    Slider,
    Switch,
    ScrollArea,
    ColorInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import {
    IconSettings,
    IconSun,
    IconMoon,
    IconDeviceDesktop,
    IconLayoutSidebar,
    IconLayoutNavbar,
    IconColorSwatch,
    IconDeviceFloppy,
    IconRotateClockwise,
    IconX,
    IconPointer,
    IconLock,
    IconEyeOff,
    IconAlignLeft,
    IconAlignRight,
} from '@tabler/icons-react';
import { useTheme } from '@/context/ThemeContext';
import { useNotification } from '@/hooks/useNotification';
import { useTranslation } from '@/lib/i18n/client';
import styles from './ThemeCustomizer.module.css';

export function ThemeCustomizer() {
    const { t } = useTranslation('global');
    const [opened, { open, close }] = useDisclosure(false);
    const [mounted, setMounted] = useState(false);
    const { showSuccess, showConfirm } = useNotification();
    const {
        layout,
        setLayout,
        themeMode,
        setThemeMode,
        direction,
        setDirection,
        menuColor,
        setMenuColor,
        customMenuColor,
        setCustomMenuColor,
        sidebarBackground,
        setSidebarBackground,
        customSidebarColor,
        setCustomSidebarColor,
        topBackground,
        setTopBackground,
        customTopColor,
        setCustomTopColor,
        sidebarWidth,
        setSidebarWidth,
        footerVisible,
        setFooterVisible,
        topBarScroll,
        setTopBarScroll,
        savePreferences,
        resetPreferences,
    } = useTheme();
    
    // Use layout-specific background state
    const currentBackground = layout === 'sidebar' ? sidebarBackground : topBackground;
    const setCurrentBackground = layout === 'sidebar' ? setSidebarBackground : setTopBackground;
    const currentCustomColor = layout === 'sidebar' ? customSidebarColor : customTopColor;
    const setCurrentCustomColor = layout === 'sidebar' ? setCustomSidebarColor : setCustomTopColor;

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSave = async () => {
        await savePreferences();
        showSuccess(t('settings.theme.preferencesSaved'), t('settings.theme.preferencesSavedMessage'));
        close();
    };

    const handleReset = () => {
        showConfirm(
            t('settings.theme.resetPreferences'),
            t('settings.theme.resetPreferencesConfirm'),
            () => {
                resetPreferences();
                showSuccess(t('settings.theme.preferencesReset'), t('settings.theme.preferencesResetMessage'));
                window.location.reload();
            }
        );
    };

    return (
        <>
            <ActionIcon
                variant="filled"
                color="blue"
                size="lg"
                radius="xl"
                pos="fixed"
                bottom={20}
                right={20}
                onClick={open}
                {...(styles.themeCustomizerToggleButton ? { className: styles.themeCustomizerToggleButton } : {})}
            >
                {mounted ? <IconSettings size={20} /> : <div style={{ width: 20, height: 20 }} />}
            </ActionIcon>

            {opened && (
                <div 
                    className={styles.themeCustomizerOverlay}
                    onClick={close}
                />
            )}
            <div 
                className={`${styles.themeCustomizerPanel} ${opened ? '' : styles.closed}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.themeCustomizerHeader}>
                    <h5 className={styles.themeCustomizerTitle}>{t('settings.theme.title')}</h5>
                    <div className={styles.themeCustomizerHeaderActions}>
                        <ActionIcon
                            variant="subtle"
                            onClick={handleSave}
                            title={t('buttons.save')}
                            size="lg"
                        >
                            {mounted ? <IconDeviceFloppy size={18} /> : <div style={{ width: 18, height: 18 }} />}
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            onClick={handleReset}
                            title={t('form.reset')}
                            size="lg"
                        >
                            {mounted ? <IconRotateClockwise size={18} /> : <div style={{ width: 18, height: 18 }} />}
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            onClick={close}
                            title={t('form.close')}
                            size="lg"
                        >
                            {mounted ? <IconX size={18} /> : <div style={{ width: 18, height: 18 }} />}
                        </ActionIcon>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea {...(styles.themeCustomizerContent ? { className: styles.themeCustomizerContent } : {})}>
                    <div>
                        {/* 1. Theme Mode */}
                        <div className={styles.themeCustomizerSection}>
                            <h6 className={styles.themeCustomizerSectionTitle}>Tema</h6>
                            <div className={`${styles.themeCustomizerOptions} ${styles.threeCols}`}>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="layout-theme-light"
                                        name="layout-theme"
                                        value="light"
                                        checked={themeMode === 'light'}
                                        onChange={() => setThemeMode('light')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="layout-theme-light" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? <IconSun size={20} /> : <div style={{ width: 20, height: 20 }} />}
                                        </span>
                                        <div className={styles.cardRadioText}>Açık</div>
                                    </label>
                                </div>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="layout-theme-dark"
                                        name="layout-theme"
                                        value="dark"
                                        checked={themeMode === 'dark'}
                                        onChange={() => setThemeMode('dark')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="layout-theme-dark" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? <IconMoon size={20} /> : <div style={{ width: 20, height: 20 }} />}
                                        </span>
                                        <div className={styles.cardRadioText}>Koyu</div>
                                    </label>
                                </div>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="layout-theme-auto"
                                        name="layout-theme"
                                        value="auto"
                                        checked={themeMode === 'auto'}
                                        onChange={() => setThemeMode('auto')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="layout-theme-auto" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? <IconDeviceDesktop size={20} /> : <div style={{ width: 20, height: 20 }} />}
                                        </span>
                                        <div className={styles.cardRadioText}>Otomatik</div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 2. Direction */}
                        <div className={styles.themeCustomizerSection}>
                            <h6 className={styles.themeCustomizerSectionTitle}>Yön</h6>
                            <div className={styles.themeCustomizerOptions}>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="direction-ltr"
                                        name="layout-direction"
                                        value="ltr"
                                        checked={direction === 'ltr'}
                                        onChange={() => setDirection('ltr')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="direction-ltr" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? <IconAlignLeft size={20} /> : <div style={{ width: 20, height: 20 }} />}
                                        </span>
                                        <div className={styles.cardRadioText}>LTR</div>
                                    </label>
                                </div>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="direction-rtl"
                                        name="layout-direction"
                                        value="rtl"
                                        checked={direction === 'rtl'}
                                        onChange={() => setDirection('rtl')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="direction-rtl" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? <IconAlignRight size={20} /> : <div style={{ width: 20, height: 20 }} />}
                                        </span>
                                        <div className={styles.cardRadioText}>RTL</div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 3. Layout Style */}
                        <div className={styles.themeCustomizerSection}>
                            <h6 className={styles.themeCustomizerSectionTitle}>Layout Stili</h6>
                            <div className={`${styles.themeCustomizerOptions} ${styles.threeCols}`}>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="layout-sidebar"
                                        name="layout"
                                        value="sidebar"
                                        checked={layout === 'sidebar'}
                                        onChange={() => setLayout('sidebar')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="layout-sidebar" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? (
                                                <IconLayoutSidebar 
                                                    size={20} 
                                                    style={{ transform: direction === 'rtl' ? 'scaleX(-1)' : 'none' }} 
                                                />
                                            ) : (
                                                <div style={{ width: 20, height: 20 }} />
                                            )}
                                        </span>
                                        <div className={styles.cardRadioText}>Sidebar</div>
                                    </label>
                                </div>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="layout-top"
                                        name="layout"
                                        value="top"
                                        checked={layout === 'top'}
                                        onChange={() => setLayout('top')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="layout-top" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? <IconLayoutNavbar size={20} /> : <div style={{ width: 20, height: 20 }} />}
                                        </span>
                                        <div className={styles.cardRadioText}>Top</div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 4. Menu and Menu Icon Color */}
                        <div className={styles.themeCustomizerSection}>
                            <h6 className={styles.themeCustomizerSectionTitle} suppressHydrationWarning>
                                {mounted ? (layout === 'sidebar' ? t('settings.theme.menuColor') : t('settings.theme.topMenuColor')) : t('settings.theme.menuColor')}
                            </h6>
                            <div className={`${styles.themeCustomizerOptions} ${styles.fourCols}`}>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="menu-color-auto"
                                        name="sidebar-theme"
                                        value="auto"
                                        checked={menuColor === 'auto'}
                                        onChange={() => setMenuColor('auto')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="menu-color-auto" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            <span className={styles.colorPreview} style={{ background: '#ffffff', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                                        </span>
                                        <div className={styles.cardRadioText}>Otomatik</div>
                                    </label>
                                </div>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="menu-color-light"
                                        name="sidebar-theme"
                                        value="light"
                                        checked={menuColor === 'light'}
                                        onChange={() => setMenuColor('light')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="menu-color-light" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            <span className={styles.colorPreview} style={{ background: '#ffffff', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                                        </span>
                                        <div className={styles.cardRadioText}>Açık</div>
                                    </label>
                                </div>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="menu-color-dark"
                                        name="sidebar-theme"
                                        value="dark"
                                        checked={menuColor === 'dark'}
                                        onChange={() => setMenuColor('dark')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="menu-color-dark" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            <span className={styles.colorPreview} style={{ background: '#1f2327', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                                        </span>
                                        <div className={styles.cardRadioText}>Koyu</div>
                                    </label>
                                </div>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="menu-color-custom"
                                        name="sidebar-theme"
                                        value="custom"
                                        checked={menuColor === 'custom'}
                                        onChange={() => setMenuColor('custom')}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="menu-color-custom" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? <IconColorSwatch size={20} /> : <div style={{ width: 20, height: 20 }} />}
                                        </span>
                                        <div className={styles.cardRadioText}>Özel</div>
                                    </label>
                                </div>
                            </div>
                            {menuColor === 'custom' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div className={styles.colorPalette}>
                                        {['#228be6', '#37b24d', '#fa5252', '#fd7e14', '#fab005', '#7950f2', '#e64980', '#000000', '#ffffff', '#868e96', '#40c057', '#ff6b6b', '#4c6ef5', '#845ef7', '#f06595', '#ffd43b', '#ff922b'].map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`${styles.colorSwatch} ${customMenuColor === color ? styles.colorSwatchActive : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setCustomMenuColor(color)}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                    <ColorInput
                                        value={customMenuColor}
                                        onChange={setCustomMenuColor}
                                        format="hex"
                                        withPicker
                                        mt="sm"
                                        size="sm"
                                        placeholder="Renk kodu girin"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 5. Sidebar/Top Background */}
                        <div className={styles.themeCustomizerSection}>
                            <h6 className={styles.themeCustomizerSectionTitle} suppressHydrationWarning>
                                {mounted ? (layout === 'sidebar' ? 'Sidebar Arka Plan' : 'Top Arka Plan') : 'Sidebar Arka Plan'}
                            </h6>
                            <div className={`${styles.themeCustomizerOptions} ${styles.threeCols}`}>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="sidebar-bg-light"
                                        name="sidebar-background"
                                        value="light"
                                        checked={currentBackground === 'light'}
                                        onChange={() => {
                                            setCurrentBackground('light');
                                            if (menuColor !== 'auto') {
                                                setMenuColor('auto');
                                            }
                                        }}
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
                                        checked={currentBackground === 'dark'}
                                        onChange={() => {
                                            setCurrentBackground('dark');
                                            if (menuColor !== 'auto') {
                                                setMenuColor('auto');
                                            }
                                        }}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="sidebar-bg-dark" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            <span className={styles.colorPreview} style={{ background: '#000000', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
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
                                        checked={currentBackground === 'brand'}
                                        onChange={() => {
                                            setCurrentBackground('brand');
                                            if (menuColor !== 'auto') {
                                                setMenuColor('auto');
                                            }
                                        }}
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
                                        id="sidebar-bg-gradient"
                                        name="sidebar-background"
                                        value="gradient"
                                        checked={currentBackground === 'gradient'}
                                        onChange={() => {
                                            setCurrentBackground('gradient');
                                            if (menuColor !== 'auto') {
                                                setMenuColor('auto');
                                            }
                                        }}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="sidebar-bg-gradient" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            <span className={styles.colorPreview} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px' }}></span>
                                        </span>
                                        <div className={styles.cardRadioText}>Gradyan</div>
                                    </label>
                                </div>
                                <div className={styles.cardRadio}>
                                    <input
                                        type="radio"
                                        id="sidebar-bg-custom"
                                        name="sidebar-background"
                                        value="custom"
                                        checked={currentBackground === 'custom'}
                                        onChange={() => {
                                            setCurrentBackground('custom');
                                            if (menuColor !== 'auto') {
                                                setMenuColor('auto');
                                            }
                                        }}
                                        className={styles.cardRadioInput}
                                    />
                                    <label htmlFor="sidebar-bg-custom" className={styles.cardRadioLabel}>
                                        <span className={styles.cardRadioIcon}>
                                            {mounted ? <IconColorSwatch size={20} /> : <div style={{ width: 20, height: 20 }} />}
                                        </span>
                                        <div className={styles.cardRadioText}>Özel</div>
                                    </label>
                                </div>
                            </div>
                            {currentBackground === 'custom' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div className={styles.colorPalette}>
                                        {['#228be6', '#37b24d', '#fa5252', '#fd7e14', '#fab005', '#7950f2', '#e64980', '#000000', '#ffffff', '#868e96', '#40c057', '#ff6b6b', '#4c6ef5', '#845ef7', '#f06595', '#ffd43b', '#ff922b'].map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`${styles.colorSwatch} ${currentCustomColor === color ? styles.colorSwatchActive : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => {
                                                    setCurrentCustomColor(color);
                                                    // Automatically set menu color to auto for automatic contrast
                                                    if (menuColor !== 'auto') {
                                                        setMenuColor('auto');
                                                    }
                                                }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                    <ColorInput
                                        value={currentCustomColor}
                                        onChange={(value) => {
                                            setCurrentCustomColor(value);
                                            // Automatically set menu color to auto for automatic contrast
                                            if (menuColor !== 'auto') {
                                                setMenuColor('auto');
                                            }
                                        }}
                                        format="hex"
                                        withPicker
                                        mt="sm"
                                        size="sm"
                                        placeholder="Renk kodu girin"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 6. Sidebar Width */}
                        {mounted && layout === 'sidebar' && (
                            <div className={styles.sliderSection}>
                                <div className={styles.sliderLabel}>
                                    <h6 className={styles.themeCustomizerSectionTitle} style={{ margin: 0 }}>Sidebar Genişliği</h6>
                                    <span className={styles.sliderValue}>{sidebarWidth}px</span>
                                </div>
                                <Slider
                                    value={sidebarWidth}
                                    onChange={setSidebarWidth}
                                    min={200}
                                    max={320}
                                    step={10}
                                    marks={[
                                        { value: 200, label: '200px' },
                                        { value: 260, label: '260px' },
                                        { value: 320, label: '320px' },
                                    ]}
                                />
                            </div>
                        )}

                        {/* 7. Top Bar Scroll Behavior */}
                        {mounted && layout === 'top' && (
                            <div className={styles.themeCustomizerSection}>
                                <h6 className={styles.themeCustomizerSectionTitle}>Top Bar Kaydırma</h6>
                                <div className={`${styles.themeCustomizerOptions} ${styles.threeCols}`}>
                                    <div className={styles.cardRadio}>
                                        <input
                                            type="radio"
                                            id="topbar-scroll-fixed"
                                            name="topbar-scroll"
                                            value="fixed"
                                            checked={topBarScroll === 'fixed'}
                                            onChange={() => setTopBarScroll('fixed')}
                                            className={styles.cardRadioInput}
                                        />
                                        <label htmlFor="topbar-scroll-fixed" className={styles.cardRadioLabel}>
                                            <span className={styles.cardRadioIcon}>
                                                {mounted ? <IconLock size={18} /> : <div style={{ width: 18, height: 18 }} />}
                                            </span>
                                            <div className={styles.cardRadioText}>Sabit</div>
                                        </label>
                                    </div>
                                    <div className={styles.cardRadio}>
                                        <input
                                            type="radio"
                                            id="topbar-scroll-hidden"
                                            name="topbar-scroll"
                                            value="hidden"
                                            checked={topBarScroll === 'hidden'}
                                            onChange={() => setTopBarScroll('hidden')}
                                            className={styles.cardRadioInput}
                                        />
                                        <label htmlFor="topbar-scroll-hidden" className={styles.cardRadioLabel}>
                                            <span className={styles.cardRadioIcon}>
                                                {mounted ? <IconEyeOff size={18} /> : <div style={{ width: 18, height: 18 }} />}
                                            </span>
                                            <div className={styles.cardRadioText}>Gizli</div>
                                        </label>
                                    </div>
                                    <div className={styles.cardRadio}>
                                        <input
                                            type="radio"
                                            id="topbar-scroll-hover"
                                            name="topbar-scroll"
                                            value="hidden-on-hover"
                                            checked={topBarScroll === 'hidden-on-hover'}
                                            onChange={() => setTopBarScroll('hidden-on-hover')}
                                            className={styles.cardRadioInput}
                                        />
                                        <label htmlFor="topbar-scroll-hover" className={styles.cardRadioLabel}>
                                            <span className={styles.cardRadioIcon}>
                                                {mounted ? <IconPointer size={18} /> : <div style={{ width: 18, height: 18 }} />}
                                            </span>
                                            <div className={styles.cardRadioText}>Hover</div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 8. Footer Visibility */}
                        <div className={styles.switchSection}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className={styles.switchLabel}>
                                    <h6 className={styles.themeCustomizerSectionTitle} style={{ margin: 0 }}>Footer</h6>
                                    <span className={styles.switchDescription}>
                                        {footerVisible ? 'Görünür' : 'Gizli'}
                                    </span>
                                </div>
                                <Switch
                                    checked={footerVisible}
                                    onChange={(event) => setFooterVisible(event.currentTarget.checked)}
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className={styles.themeCustomizerFooter}>
                    <Button
                        variant="default"
                        size="sm"
                        leftSection={mounted ? <IconRotateClockwise size={16} /> : <div style={{ width: 16, height: 16 }} />}
                        onClick={handleReset}
                    >
                        Sıfırla
                    </Button>
                    <Button
                        variant="filled"
                        size="sm"
                        leftSection={mounted ? <IconDeviceFloppy size={16} /> : <div style={{ width: 16, height: 16 }} />}
                        onClick={handleSave}
                    >
                        Kaydet
                    </Button>
                </div>
            </div>
        </>
    );
}
