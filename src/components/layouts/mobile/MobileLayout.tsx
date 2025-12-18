/**
 * MobileLayout
 * Mobil cihazlar için ana layout
 * Sidebar ve Top layout değişikliklerinden bağımsız
 */

'use client';

import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { MobileHeader } from './MobileHeader';
import { MobileMenu } from './MobileMenu';
import { Footer } from '../shared/Footer';
import { useLayout } from '../core/LayoutProvider';
import { useTranslation } from '@/lib/i18n/client';
import styles from './MobileLayout.module.css';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  const [searchOpened, { toggle: toggleSearch }] = useDisclosure(false);
  const { config } = useLayout();
  const { t } = useTranslation('global');

  return (
    <div className={styles.mobileLayout}>
      {/* Header */}
      <MobileHeader onMenuToggle={toggleMenu} searchOpened={searchOpened} onSearchToggle={toggleSearch} />

      {/* Search Bar - Header altında */}
      {searchOpened && (
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

      {/* Menu Drawer */}
      <MobileMenu opened={menuOpened} onClose={closeMenu} />

      {/* Main Content */}
      <main
        className={styles.mobileContent}
        style={{
          paddingTop: config.contentArea?.responsive?.mobile?.padding?.top || config.contentArea?.padding.top || 16,
          paddingRight: config.contentArea?.responsive?.mobile?.padding?.right || config.contentArea?.padding.right || 16,
          paddingBottom: config.contentArea?.responsive?.mobile?.padding?.bottom || config.contentArea?.padding.bottom || 16,
          paddingLeft: config.contentArea?.responsive?.mobile?.padding?.left || config.contentArea?.padding.left || 16,
        }}
      >
        {children}
      </main>

      {/* Footer */}
      {config.footerVisible && <Footer />}
    </div>
  );
}

