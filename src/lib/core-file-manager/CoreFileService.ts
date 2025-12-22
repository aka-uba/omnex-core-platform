// Core File Manager Service
// FAZ 0.1: Merkezi Dosya Yönetim Sistemi
// Tüm modüller bu servisi kullanarak dosya yönetimi yapacak

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  UploadOptions,
  BuildPathOptions,
  CoreFile,
  FilePermissions,
} from './types';

export class CoreFileService {
  private storageBasePath: string;
  private tenantPrisma: TenantPrismaClient;

  constructor(tenantPrisma: TenantPrismaClient, storageBasePath: string = './storage') {
    this.tenantPrisma = tenantPrisma;
    this.storageBasePath = storageBasePath;
  }

  /**
   * Entity için okunabilir klasör adı oluştur
   * Kiracı: hitap-adı-soyadı (örn: Herr_Max_Mustermann)
   * Daire: adres-gayrimenkul-adı-daire-no (örn: Hauptstr_42_Bahce_Evleri_W01)
   * Gayrimenkul: adres-gayrimenkul-ismi (örn: Hauptstr_42_Bahce_Evleri)
   */
  private async getEntityFolderName(
    entityType: string,
    entityId: string
  ): Promise<string | null> {
    try {
      if (entityType === 'apartment') {
        // Daire için: adres-gayrimenkul-adı-daire-no
        const apartment = await this.tenantPrisma.apartment.findUnique({
          where: { id: entityId },
          select: {
            unitNumber: true,
            property: {
              select: {
                name: true,
                street: true,
                buildingNo: true
              }
            }
          }
        });
        if (apartment) {
          const property = apartment.property;
          // Adres kısmı: sokak + bina no
          const addressPart = property?.street
            ? `${property.street}${property.buildingNo ? '_' + property.buildingNo : ''}`
            : '';
          const propertyName = property?.name || 'Unknown';
          // Format: Hauptstr_42_Bahce_Evleri_W01
          const parts = [addressPart, propertyName, apartment.unitNumber].filter(Boolean);
          return parts.join('_');
        }
      } else if (entityType === 'property') {
        // Gayrimenkul için: adres-gayrimenkul-ismi
        const property = await this.tenantPrisma.property.findUnique({
          where: { id: entityId },
          select: {
            name: true,
            street: true,
            buildingNo: true
          }
        });
        if (property) {
          // Adres kısmı: sokak + bina no
          const addressPart = property.street
            ? `${property.street}${property.buildingNo ? '_' + property.buildingNo : ''}`
            : '';
          // Format: Hauptstr_42_Bahce_Evleri
          const parts = [addressPart, property.name].filter(Boolean);
          return parts.join('_');
        }
      } else if (entityType === 'tenant') {
        // Kiracı için: hitap-adı-soyadı
        const tenant = await this.tenantPrisma.tenant.findUnique({
          where: { id: entityId },
          select: {
            salutation: true,
            firstName: true,
            lastName: true,
            tenantType: true,
            companyName: true
          }
        });
        if (tenant) {
          // Şirket ise şirket adı
          if (tenant.tenantType === 'company' && tenant.companyName) {
            return tenant.companyName;
          }
          // Kişi ise: Herr_Max_Mustermann
          const parts = [
            tenant.salutation,
            tenant.firstName,
            tenant.lastName
          ].filter(Boolean);
          return parts.join('_') || 'Unknown';
        }
      }
    } catch (error) {
      console.error('Error getting entity folder name:', error);
    }
    return null;
  }

  /**
   * Dosya yükleme - tüm modüller için ortak
   */
  async uploadFile(options: UploadOptions): Promise<CoreFile> {
    const {
      tenantId,
      tenantSlug,
      companyId,
      module,
      entityType,
      entityId,
      file,
      userId,
      permissions,
      metadata = {},
    } = options;

    // Entity için okunabilir klasör adı al
    let entityName: string | undefined;
    if (entityType && entityId) {
      const folderName = await this.getEntityFolderName(entityType, entityId);
      if (folderName) {
        entityName = folderName;
      }
    }

    // 1. Dosya yolunu oluştur (tenantSlug ile dosya yöneticisiyle uyumlu yol)
    const filePath = this.buildFilePath({
      tenantSlug,
      module,
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(entityName ? { entityName } : {}),
      filename: typeof file === 'object' && 'name' in file ? file.name : 'file',
    });

    // 2. İzinleri kontrol et
    await this.validatePermissions(tenantId, module, userId, 'write');

    // 3. Fiziksel klasör yapısını oluştur
    const fullPath = path.join(this.storageBasePath, filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    // 4. Dosyayı fiziksel olarak kaydet
    const fileBuffer = typeof file === 'object' && 'arrayBuffer' in file
      ? Buffer.from(await file.arrayBuffer())
      : file as Buffer;

    await fs.writeFile(fullPath, fileBuffer);

    // 5. Dosya bilgilerini hazırla
    const originalName = typeof file === 'object' && 'name' in file ? file.name : 'file';
    const extension = path.extname(originalName).slice(1).toLowerCase();
    const mimeType = typeof file === 'object' && 'type' in file ? file.type : 'application/octet-stream';
    const size = fileBuffer.length;

    // 6. Varsayılan izinleri al
    const defaultPermissions = permissions || await this.getDefaultPermissions(module, entityType);

    // 7. Database kaydı oluştur
    const coreFile = await this.tenantPrisma.coreFile.create({
      data: {
        tenantId,
        companyId,
        module,
        entityType: entityType || null,
        entityId: entityId || null,
        filename: path.basename(fullPath),
        originalName,
        path: filePath,
        fullPath,
        size,
        mimeType,
        extension,
        title: metadata.title || null,
        description: metadata.description || null,
        tags: metadata.tags || [],
        category: metadata.category || null,
        permissions: defaultPermissions as any,
        createdBy: userId,
        updatedBy: userId,
        version: 1,
        isLatest: true,
      },
    });

    return coreFile as unknown as CoreFile;
  }

  /**
   * Modül bazlı dosya yolu oluşturma
   * tenantSlug kullanarak dosya yöneticisiyle uyumlu yol oluşturur
   * Örnek yapı: tenants/{slug}/module-files/real-estate/apartments/{entityName}/{timestamp}/{file}
   */
  private buildFilePath(options: BuildPathOptions): string {
    const { tenantSlug, module, entityType, entityId, entityName, filename } = options;
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Dosya yöneticisi yapısı: tenants/{slug}/module-files/{module}/...
    let filePath = `tenants/${tenantSlug}/module-files/${module}/`;

    // Entity type'a göre alt klasör (apartments, properties, tenants, etc.)
    if (entityType) {
      filePath += `${entityType}/`;
    }

    // Entity name'e göre anlamlı klasör adı (örn: "Hauptstr_42_W01" veya entityId)
    if (entityName) {
      const safeFolderName = this.sanitizeFilename(entityName);
      filePath += `${safeFolderName}/`;
    } else if (entityId) {
      // entityName yoksa entityId kullan
      filePath += `${entityId}/`;
    }

    // Tarih bazlı organizasyon
    filePath += `${timestamp}/`;

    // Benzersiz dosya adı
    const uniqueId = randomUUID().slice(0, 8);
    const safeFilename = this.sanitizeFilename(filename);
    filePath += `${uniqueId}_${safeFilename}`;

    return filePath;
  }

  /**
   * Dosya adını güvenli hale getir
   */
  private sanitizeFilename(filename: string): string {
    // Tehlikeli karakterleri temizle
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100); // Maksimum uzunluk
  }

  /**
   * Dosya erişim kontrolü
   */
  async checkFileAccess(
    fileId: string,
    userId: string,
    action: 'read' | 'write' | 'delete' | 'share'
  ): Promise<boolean> {
    const file = await this.tenantPrisma.coreFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return false;
    }

    const permissions = file.permissions as unknown as FilePermissions;

    // Public dosyalar için okuma izni
    if (action === 'read' && permissions.isPublic) {
      return true;
    }

    // İzin kontrolü
    const allowedUsers = permissions[action] || [];
    return allowedUsers.includes(userId) || allowedUsers.includes('*');
  }

  /**
   * İzinleri doğrula
   */
  private async validatePermissions(
    tenantId: string,
    module: string,
    userId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<void> {
    // TODO: Gerçek izin kontrolü implement edilecek
    // Şimdilik sadece placeholder
    return;
  }

  /**
   * Varsayılan izinleri al
   */
  private async getDefaultPermissions(
    module: string,
    entityType?: string
  ): Promise<FilePermissions> {
    // Real-estate modülündeki görseller varsayılan olarak public (apartment, property, tenant)
    const isPublic = module === 'real-estate' &&
      (entityType === 'apartment' || entityType === 'property' || entityType === 'tenant');

    // Varsayılan izinler: oluşturan kullanıcı tüm yetkilere sahip
    return {
      read: ['*'], // Tüm kullanıcılar okuyabilir (modül izinleri kontrol edilecek)
      write: [], // Sadece oluşturan yazabilir
      delete: [], // Sadece oluşturan silebilir
      share: [], // Sadece oluşturan paylaşabilir
      isPublic,
    };
  }

  /**
   * Modüller için özel method'lar
   */
  async uploadInvoice(
    tenantId: string,
    tenantSlug: string,
    companyId: string,
    invoiceId: string,
    file: File | Buffer,
    userId: string
  ): Promise<CoreFile> {
    return this.uploadFile({
      tenantId,
      tenantSlug,
      companyId,
      module: 'accounting',
      entityType: 'invoice',
      entityId: invoiceId,
      file,
      userId,
    });
  }

  async uploadNotificationAttachment(
    tenantId: string,
    tenantSlug: string,
    companyId: string,
    notificationId: string,
    file: File | Buffer,
    userId: string
  ): Promise<CoreFile> {
    return this.uploadFile({
      tenantId,
      tenantSlug,
      companyId,
      module: 'notifications',
      entityType: 'attachment',
      entityId: notificationId,
      file,
      userId,
    });
  }

  async uploadMaintenanceDocument(
    tenantId: string,
    tenantSlug: string,
    companyId: string,
    maintenanceId: string,
    file: File | Buffer,
    userId: string
  ): Promise<CoreFile> {
    return this.uploadFile({
      tenantId,
      tenantSlug,
      companyId,
      module: 'maintenance',
      entityType: 'document',
      entityId: maintenanceId,
      file,
      userId,
    });
  }

  /**
   * Dosya listesi getir
   */
  async getFiles(options: {
    tenantId: string;
    module?: string;
    entityType?: string;
    entityId?: string;
  }): Promise<CoreFile[]> {
    const { tenantId, module, entityType, entityId } = options;

    const files = await this.tenantPrisma.coreFile.findMany({
      where: {
        tenantId,
        ...(module && { module }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        isLatest: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return files as unknown as CoreFile[];
  }

  /**
   * Dosya sil
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    // İzin kontrolü
    const hasAccess = await this.checkFileAccess(fileId, userId, 'delete');
    if (!hasAccess) {
      throw new Error('Unauthorized: No permission to delete this file');
    }

    const file = await this.tenantPrisma.coreFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Fiziksel dosyayı sil
    try {
      await fs.unlink(file.fullPath);
    } catch (error) {
      // Dosya zaten silinmiş olabilir, devam et
    }

    // Database kaydını sil
    await this.tenantPrisma.coreFile.delete({
      where: { id: fileId },
    });
  }

  /**
   * Dosya paylaş
   */
  async shareFile(
    fileId: string,
    sharedBy: string,
    sharedWith: string,
    permission: 'view' | 'download' | 'edit',
    expiresAt?: Date,
    accessCode?: string
  ) {
    // İzin kontrolü
    const hasAccess = await this.checkFileAccess(fileId, sharedBy, 'share');
    if (!hasAccess) {
      throw new Error('Unauthorized: No permission to share this file');
    }

    // Get file to retrieve tenantId and companyId
    const file = await this.tenantPrisma.coreFile.findUnique({
      where: { id: fileId },
      select: { tenantId: true, companyId: true },
    });

    if (!file || !file.tenantId || !file.companyId) {
      throw new Error('File not found or missing tenantId/companyId');
    }

    const shareData: any = {
      tenantId: file.tenantId,
      companyId: file.companyId,
      fileId,
      sharedBy,
      sharedWith,
      permission,
      downloadCount: 0,
    };

    if (expiresAt !== undefined && expiresAt !== null) {
      shareData.expiresAt = expiresAt;
    }

    if (accessCode !== undefined && accessCode !== null) {
      shareData.accessCode = accessCode;
    }

    return this.tenantPrisma.fileShare.create({
      data: shareData,
    });
  }
}
