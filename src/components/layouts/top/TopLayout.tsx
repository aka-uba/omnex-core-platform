/**
 * TopLayout v2
 * Top navigation layout - yeni yapılandırma sistemi ile
 */

'use client';

import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useLayout } from '../core/LayoutProvider';
import { useTranslation } from '@/lib/i18n/client';
import { TopHeader } from './TopHeader';
import { Footer } from '../shared/Footer';
import { ContentArea } from '../shared/ContentArea';
import { ThemeConfigurator } from '../configurator/ThemeConfigurator';
import styles from './TopLayout.module.css';

interface TopLayoutProps {
  children: React.ReactNode;
}

export function TopLayout({ children }: TopLayoutProps) {
  const { config, isMobile, isTablet } = useLayout();
  const { t } = useTranslation('global');
  const topConfig = config.top;
  const [searchOpened, { toggle: toggleSearch }] = useDisclosure(false);

  // TopHeader zaten CSS variable'ları inline style ile set ediyor

  return (
    <div className={styles.topLayout} data-scroll-behavior={topConfig?.scrollBehavior || 'fixed'}>
      {/* Header */}
      <TopHeader searchOpened={searchOpened} onSearchToggle={toggleSearch} />

      {/* Search Bar - Header altında (mobil ve tablet için) */}
      {(isMobile || isTablet) && searchOpened && (
        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper}>
            <IconSearch size={20} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('layout.searchPlaceholder')}
              className={styles.searchInput}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={styles.main}>
        <ContentArea>{children}</ContentArea>
      </main>

      {/* Footer */}
      {config.footerVisible && <Footer />}
      {/* Theme Configurator */}
      <ThemeConfigurator />
    </div>
  );
}

