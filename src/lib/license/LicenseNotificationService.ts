/**
 * License Notification Service
 * Otomatik lisans bildirimleri için servis
 */

import { corePrisma } from '@/lib/corePrisma';
import { getTenantPrisma } from '@/lib/dbSwitcher';
import { getTenantDbUrl } from '@/lib/services/tenantService';
import type { NotificationType } from '@/modules/license/types/license';
import dayjs from 'dayjs';

export class LicenseNotificationService {
  /**
   * Süresi yaklaşan lisansları kontrol et ve bildirim oluştur
   * @param daysBeforeExpiry - Kaç gün önceden bildirim gönderilecek (varsayılan: 30)
   */
  async checkExpiringLicenses(daysBeforeExpiry: number = 30): Promise<void> {
    const expiryDate = dayjs().add(daysBeforeExpiry, 'days').toDate();
    const now = new Date();

    // Süresi yaklaşan aktif lisansları bul
    const expiringLicenses = await corePrisma.tenantLicense.findMany({
      where: {
        status: 'active',
        endDate: {
          gte: now,
          lte: expiryDate,
        },
      },
      include: {
        tenant: true,
        package: true,
      },
    });

    for (const license of expiringLicenses) {
      const daysUntilExpiry = dayjs(license.endDate).diff(dayjs(), 'days');
      
      // Bildirim oluştur
      await this.sendNotification(
        license.tenantId,
        license.id,
        'expiring_soon',
        `Your license "${license.package.name}" will expire in ${daysUntilExpiry} days. Please renew your license.`,
        `/${license.tenant.slug}/settings/license`
      );
    }
  }

  /**
   * Süresi dolmuş lisansları kontrol et ve bildirim oluştur
   */
  async checkExpiredLicenses(): Promise<void> {
    const now = new Date();

    // Süresi dolmuş aktif lisansları bul
    const expiredLicenses = await corePrisma.tenantLicense.findMany({
      where: {
        status: 'active',
        endDate: {
          lt: now,
        },
      },
      include: {
        tenant: true,
        package: true,
      },
    });

    for (const license of expiredLicenses) {
      // Lisans durumunu güncelle
      await corePrisma.tenantLicense.update({
        where: { id: license.id },
        data: { status: 'expired' },
      });

      // Bildirim oluştur
      await this.sendNotification(
        license.tenantId,
        license.id,
        'expired',
        `Your license "${license.package.name}" has expired. Please renew your license to continue using the service.`,
        `/${license.tenant.slug}/settings/license`
      );
    }
  }

  /**
   * Ödeme bekleyen lisansları kontrol et ve bildirim oluştur
   */
  async checkPendingPayments(): Promise<void> {
    const now = new Date();

    // Ödeme bekleyen aktif lisansları bul
    const pendingPaymentLicenses = await corePrisma.tenantLicense.findMany({
      where: {
        status: 'active',
        paymentStatus: 'pending',
        nextPaymentDate: {
          lte: now,
        },
      },
      include: {
        tenant: true,
        package: true,
      },
    });

    for (const license of pendingPaymentLicenses) {
      // Bildirim oluştur
      await this.sendNotification(
        license.tenantId,
        license.id,
        'payment_required',
        `Payment is required for your license "${license.package.name}". Please complete the payment to continue using the service.`,
        `/${license.tenant.slug}/settings/license`
      );
    }
  }

  /**
   * Bildirim gönder
   * @param tenantId - Tenant ID
   * @param licenseId - License ID
   * @param type - Bildirim tipi
   * @param message - Bildirim mesajı
   * @param actionUrl - Aksiyon URL'i
   */
  async sendNotification(
    tenantId: string,
    licenseId: string,
    type: NotificationType,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    try {
      // Tenant database'ine bağlan
      const tenant = await corePrisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return;
      }

      // Tenant Prisma client'ını al
      const dbUrl = getTenantDbUrl(tenant);
      const tenantPrisma = getTenantPrisma(dbUrl);

      // Get companyId from first company for tenant
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstCompany) {
        throw new Error('No company found for tenant');
      }

      const notificationData: any = {
        tenantId,
        companyId: firstCompany.id,
        licenseId,
        type,
        message,
      };

      if (actionUrl !== undefined && actionUrl !== null) {
        notificationData.actionUrl = actionUrl;
      }

      // LicenseNotification kaydı oluştur
      await tenantPrisma.licenseNotification.create({
        data: notificationData,
      });

      // Merkezi bildirim sistemine de bildirim gönder
      try {
        const { createNotification } = await import('@/lib/notifications/notificationService');
        await createNotification({
          title: 'License Notification',
          message,
          ...(type === 'expired' ? { type: 'error' } : type === 'expiring_soon' ? { type: 'warning' } : { type: 'info' }),
          ...(type === 'expired' ? { priority: 'high' } : { priority: 'medium' }),
          module: 'license',
          ...(actionUrl ? { actionUrl } : {}),
          data: {
            licenseId,
            notificationType: type,
          },
        });
      } catch (notifError) {
        // Merkezi bildirim hatası kritik değil, sessizce devam et
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Tüm kontrolleri çalıştır (cron job için)
   */
  async runAllChecks(): Promise<void> {
    await Promise.all([
      this.checkExpiringLicenses(),
      this.checkExpiredLicenses(),
      this.checkPendingPayments(),
    ]);
  }
}

// Singleton instance
export const licenseNotificationService = new LicenseNotificationService();

