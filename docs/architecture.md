# Multi-Tenant Enterprise Architecture

## Genel Bakış

Omnex Core Platform, **per-tenant database** mimarisi ile enterprise seviyesinde multi-tenant SaaS platformudur. Her tenant (firma) için ayrı PostgreSQL veritabanı oluşturulur ve veri izolasyonu sağlanır.

## Mimari Model

**Shared Codebase + Per-Tenant Database + Subdomain/Path Routing + Tenant Context**

### Temel Bileşenler

1. **Core Database (PostgreSQL)**
   - Tenant metadata ve yönetimi
   - Agency bilgileri
   - Platform geneli modül yönetimi
   - Super admin işlemleri

2. **Tenant Databases (PostgreSQL)**
   - Her tenant için ayrı database
   - Tenant'a özel tüm veriler (User, Company, Notification, Report, vb.)
   - Tam veri izolasyonu

3. **Routing Sistemi**
   - **Production**: Subdomain routing (`acme.onwindos.com`)
   - **Staging/Dev**: Path-based routing (`/tenant/acme`)
   - Otomatik tenant çözümleme

4. **Yearly Database Rotation**
   - Tenant oluşturulduğu yıl bazlı DB isimlendirme
   - Örnek: `tenant_acme_2025`, `tenant_acme_2026`
   - Performans ve arşivleme yönetimi

## Veri Modeli İlişkileri

### Core DB Modelleri

- **Tenant**: Tenant metadata (slug, subdomain, dbName, currentDb, allDatabases[])
- **Agency**: Tenant'ların sahibi (super admin alanı)
- **Module**: Platform geneli modül tanımları
- **ModulePermission**: Modül-rol izin ilişkileri

### Tenant DB Modelleri

- **User**: Tenant kullanıcıları (agencyId kaldırıldı)
- **Company**: Tenant'ın iş birimi (tenant DB içinde)
- **Notification**, **Report**, **AIGeneration**: Tenant'a özel veriler
- **Role**, **PermissionDefinition**: Tenant bazlı RBAC
- **AuditLog**: Aktivite timeline (GDPR/KVKK uyumluluğu)

### İlişki Mantığı

```
Agency (Core DB)
  └── Tenant (Core DB) = Company'yi temsil eder
      └── Tenant DB (PostgreSQL)
          ├── User (belongs to Tenant)
          ├── Company (tenant'ın iş birimi)
          ├── Notification
          ├── Report
          └── ... (diğer tenant verileri)
```

## Routing Stratejisi

### Production
- **Subdomain**: `acme.onwindos.com`
- Middleware host header'dan subdomain çıkarır
- Core DB'den tenant bilgisi alınır

### Staging
- **Subdomain**: `acme.staging.onwindos.com`
- **Path Fallback**: `/tenant/acme`
- Middleware her iki yöntemi destekler

### Local Development
- **Path-based**: `localhost:3000/tenant/acme`
- Subdomain desteği yok (localhost kısıtlaması)

## Database Yönetimi

### Tenant DB Oluşturma

1. Core DB'ye Tenant kaydı ekle
2. PostgreSQL'de yeni DB oluştur: `tenant_{slug}_{year}`
3. Tenant schema migration uygula (`prisma migrate deploy`)
4. Seed işlemleri (default admin user)
5. Storage folder oluştur

### Yearly Rotation

- Yeni yıl başında yeni DB oluşturulur
- `currentDb` güncellenir
- Eski DB read-only yapılabilir
- `allDatabases[]` array'ine eklenir

### Migration Yönetimi

⚠️ **KRİTİK**: Asla tenant DB üzerinde `prisma migrate dev` çalıştırmayın!

- **Core DB**: `prisma migrate dev` (development)
- **Tenant DB**: `prisma migrate deploy` (locked version)

## Güvenlik ve İzolasyon

### Veri İzolasyonu
- Her tenant'ın verileri ayrı database'de
- Cross-tenant erişim middleware tarafından engellenir
- Tenant context her request'te doğrulanır

### Audit Logging
- Tüm kullanıcı aktiviteleri loglanır
- GDPR/KVKK uyumluluğu
- Güvenlik ve hata analizi için timeline

### RBAC (Role-Based Access Control)
- Tenant bazlı rol ve izin yönetimi
- Super admin tüm tenant'ları yönetebilir
- Tenant admin sadece kendi tenant'ına erişir

## Performans Optimizasyonları

### Database Connection Pooling
- Prisma connection pooling
- Tenant DB connection cache
- DB switch latency < 10ms

### Caching Stratejisi
- Tenant metadata cache (Core DB)
- Request context'te tenant bilgisi cache
- Redis entegrasyonu (opsiyonel)

## Export/Import Sistemi

### Export Format
```
/export
  /db-dump.sql          # pg_dump output
  /files/...            # Storage files
  /meta.json            # { tenant, year, schema_version, exported_at }
```

### Kullanım Senaryoları
- Tenant migration (sunucu değişikliği)
- Backup ve restore
- Disaster recovery
- Development data transfer

## Monitoring ve Logging

### Audit Log
- Tüm CRUD işlemleri loglanır
- User activity timeline
- Entity change history
- GDPR/KVKK compliance

### Error Handling
- Tenant DB unreachable → Read-only fallback
- Migration fail → Rollback + Alert
- Export restore failed → Original DB korunur

## Environment Variables

```env
# Core DB
CORE_DATABASE_URL="postgresql://user:pass@host:5432/omnex_core"

# Tenant DB Template (__DB_NAME__ placeholder)
TENANT_DB_TEMPLATE_URL="postgresql://user:pass@host:5432/__DB_NAME__"

# PostgreSQL Admin (DB oluşturma için)
PG_ADMIN_URL="postgresql://admin:pass@host:5432/postgres"
```

## Deployment Stratejisi

### CI/CD Pipeline
1. Lint → Test → Build
2. Core DB migration (`prisma migrate deploy`)
3. Tenant migration'ları bootstrap pipeline ile yönetilir
4. Deployment

### Rollback Senaryoları
- Migration fail → Tenant `setup_failed=true`, DB drop, alert
- Tenant DB unreachable → Read-only fallback, queue writes
- Export restore failed → Original DB korunur, partial restore rollback

## Gelecek Geliştirmeler

- [ ] Redis cache entegrasyonu
- [ ] Real-time özellikler (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Automated backup sistemi
- [ ] Multi-region deployment
- [ ] Database sharding (büyük tenant'lar için)


