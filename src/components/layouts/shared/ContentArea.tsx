/**
 * ContentArea
 * Özelleştirilebilir içerik alanı
 * Genişlik, padding, margin ayarları
 */

'use client';

import { useLayout } from '../core/LayoutProvider';
import styles from './ContentArea.module.css';

interface ContentAreaProps {
  children: React.ReactNode;
}

export function ContentArea({ children }: ContentAreaProps) {
  const { config, isMobile, isTablet } = useLayout();
  const contentConfig = config.contentArea;

  // Responsive ayarlar
  const widthConfig = isMobile
    ? contentConfig?.responsive?.mobile?.width || contentConfig?.width
    : isTablet
    ? contentConfig?.responsive?.tablet?.width || contentConfig?.width
    : contentConfig?.width;

  // Default padding değerleri
  const defaultPadding = { top: 24, right: 24, bottom: 24, left: 24 };
  const defaultMobilePadding = { top: 16, right: 16, bottom: 16, left: 16 };
  const defaultTabletPadding = { top: 20, right: 20, bottom: 20, left: 20 };
  
  // Padding config hesaplama - önce responsive, sonra genel, sonra default
  const paddingConfig = isMobile
    ? (contentConfig?.responsive?.mobile?.padding ?? contentConfig?.padding ?? defaultMobilePadding)
    : isTablet
    ? (contentConfig?.responsive?.tablet?.padding ?? contentConfig?.padding ?? defaultTabletPadding)
    : (contentConfig?.padding ?? defaultPadding);

  const marginConfig = isMobile
    ? contentConfig?.responsive?.mobile?.margin || contentConfig?.margin
    : isTablet
    ? contentConfig?.responsive?.tablet?.margin || contentConfig?.margin
    : contentConfig?.margin;

  // Width hesaplama
  const widthValue = widthConfig?.value || 100;
  const widthUnit = widthConfig?.unit || '%';
  const minWidth = widthConfig?.min;
  const maxWidth = widthConfig?.max;

  // Eğer genişlik %100 ise veya mobil/tablet ise, maxWidth sınırlamasını kaldır
  const shouldRemoveMaxWidth = widthUnit === '%' && widthValue === 100;
  // Tablet ve mobil için de maxWidth'ı kaldır (1320px gibi sınırlar olmasın)
  const shouldRemoveMaxWidthForDevice = isMobile || isTablet;
  const finalMaxWidth = (shouldRemoveMaxWidth || shouldRemoveMaxWidthForDevice) ? undefined : (maxWidth ? `${maxWidth}px` : undefined);

  // Eğer maxWidth varsa ve kullanıcı margin left/right ayarlamamışsa, içeriği ortala
  // Kullanıcı margin ayarlamışsa, kullanıcının ayarını kullan
  const shouldCenter = finalMaxWidth && !marginConfig?.left && !marginConfig?.right;

  const widthStyle: React.CSSProperties = {
    width: widthUnit === '%' ? `${widthValue}%` : `${widthValue}px`,
    minWidth: minWidth ? `${minWidth}px` : undefined,
    maxWidth: finalMaxWidth,
  };

  // Padding ve margin - CSS logical properties kullan (RTL desteği için)
  // Eğer maxWidth varsa ve kullanıcı margin ayarlamamışsa, otomatik ortala
  const spacingStyle: React.CSSProperties = {
    paddingTop: paddingConfig?.top ? `${paddingConfig.top}px` : undefined,
    paddingInlineEnd: paddingConfig?.right ? `${paddingConfig.right}px` : undefined,
    paddingBottom: paddingConfig?.bottom ? `${paddingConfig.bottom}px` : undefined,
    paddingInlineStart: paddingConfig?.left ? `${paddingConfig.left}px` : undefined,
    marginTop: marginConfig?.top ? `${marginConfig.top}px` : undefined,
    marginInlineEnd: shouldCenter ? 'auto' : (marginConfig?.right ? `${marginConfig.right}px` : undefined),
    marginBottom: marginConfig?.bottom ? `${marginConfig.bottom}px` : undefined,
    marginInlineStart: shouldCenter ? 'auto' : (marginConfig?.left ? `${marginConfig.left}px` : undefined),
  };

  return (
    <div
      className={styles.contentArea}
      style={{
        ...widthStyle,
        ...spacingStyle,
      }}
    >
      {children}
    </div>
  );
}

