'use client';

import { Paper, Stack, Title, Text, Code, List, Alert, Divider } from '@mantine/core';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';

export function Documentation() {
  return (
    <Paper p="xl" shadow="sm" radius="md">
      <Stack gap="lg">
        <div>
          <Title order={2} mb="md">Veritabanı Kurulum Sihirbazı</Title>
          <Text c="dimmed" mb="lg">
            Veritabanı kurulum sihirbazı, tüm veritabanı kurulum süreçlerini manuel olarak yapabileceğiniz HTML arayüzlü bir kurulum aracıdır.
          </Text>
        </div>

        <Divider />

        <div>
          <Title order={3} mb="md">Erişim</Title>
          <List spacing="xs">
            <List.Item><Code>/setup</Code> veya <Code>/{'{locale}'}/setup</Code></List.Item>
            <List.Item><strong>Geliştirme:</strong> Her zaman erişilebilir</List.Item>
            <List.Item><strong>Production:</strong> Varsayılan olarak devre dışı</List.Item>
          </List>
        </div>

        <Divider />

        <div>
          <Title order={3} mb="md">Production Ortamında Kullanım</Title>
          
          <Alert icon={<IconAlertCircle size={18} className="tabler-icon tabler-icon-alert-circle" />} title="Güvenlik" color="yellow" mb="md">
            Production ortamında setup sayfası <strong>varsayılan olarak devre dışıdır</strong>.
          </Alert>

          <Title order={4} mb="sm">Environment Variable ile Aktifleştirme</Title>
          <Code block mb="md">
            ALLOW_SETUP_PAGE=true
          </Code>

          <Title order={4} mb="sm">Önerilen Kullanım</Title>
          <List spacing="xs" mb="md">
            <List.Item>Geçici olarak aktifleştirin: <Code>ALLOW_SETUP_PAGE=true</Code></List.Item>
            <List.Item>Kurulumu yapın</List.Item>
            <List.Item>Güvenlik için tekrar devre dışı bırakın: <Code>ALLOW_SETUP_PAGE=false</Code></List.Item>
          </List>

          <Title order={4} mb="sm">Alternatif: SSH/CLI Kullanımı</Title>
          <Code block>
{`# Schema merge
npm run schema:merge

# Validation
npm run schema:validate
npm run schema:validate-relations

# Database push
npx prisma db push --force-reset --accept-data-loss --schema=prisma/core.schema.prisma
npx prisma db push --force-reset --accept-data-loss --schema=prisma/tenant.schema.prisma

# Generate clients
npm run prisma:generate

# Seed
npm run db:seed:core
npm run db:seed:tenant -- --tenant-slug=your-tenant
npm run db:seed:demo -- --tenant-slug=your-tenant`}
          </Code>
        </div>

        <Divider />

        <div>
          <Title order={3} mb="md">Özellikler</Title>
          
          <Title order={4} mb="sm">9 Adımlı Kurulum Süreci</Title>
          <List spacing="xs" mb="md">
            <List.Item><strong>Veritabanı Bağlantısı:</strong> Veritabanı bağlantılarını test eder</List.Item>
            <List.Item><strong>Veritabanları Oluştur:</strong> Core ve tenant veritabanlarını oluşturur</List.Item>
            <List.Item><strong>Schema Birleştirme:</strong> Modüler şemaları birleştirir</List.Item>
            <List.Item><strong>Schema Doğrulama:</strong> Schema bütünlüğünü doğrular</List.Item>
            <List.Item><strong>Veritabanı Uygulama:</strong> Şemayı veritabanlarına uygular</List.Item>
            <List.Item><strong>Client Oluştur:</strong> Prisma client'larını oluşturur</List.Item>
            <List.Item><strong>Core Seed:</strong> Core veritabanını doldurur</List.Item>
            <List.Item><strong>Tenant Seed:</strong> Tenant veritabanını doldurur</List.Item>
            <List.Item><strong>Demo Seed:</strong> Demo verilerini ekler</List.Item>
          </List>

          <Title order={4} mb="sm">Özellikler</Title>
          <List spacing="xs" mb="md">
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Adım adım ilerleme</List.Item>
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Her adımı tek tek çalıştırma</List.Item>
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Tüm adımları otomatik çalıştırma</List.Item>
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Otomatik ilerleme seçeneği</List.Item>
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Gerçek zamanlı log görüntüleme</List.Item>
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Hata yönetimi ve çözüm önerileri</List.Item>
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Veritabanı sıfırlama seçenekleri</List.Item>
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Tamamlanma modal'ı</List.Item>
            <List.Item icon={<IconCheck size={16} color="green" className="tabler-icon tabler-icon-check" />}>Rapor indirme (Markdown/Text)</List.Item>
          </List>

          <Title order={4} mb="sm">Rapor İndirme</Title>
          <Text mb="sm">Kurulum tamamlandığında:</Text>
          <List spacing="xs" mb="md">
            <List.Item><strong>Markdown formatında</strong> (<Code>omnex-setup-report-YYYY-MM-DD.md</Code>)</List.Item>
            <List.Item><strong>Text formatında</strong> (<Code>omnex-setup-report-YYYY-MM-DD.txt</Code>)</List.Item>
          </List>
          <Text c="dimmed" mb="md">
            Rapor içeriği: Tarih ve durum, yapılandırma bilgileri, tüm adımların durumu, hata mesajları ve çözümler, tüm loglar
          </Text>
        </div>

        <Divider />

        <div>
          <Title order={3} mb="md">Kullanılan Script'ler</Title>
          <List spacing="xs">
            <List.Item><Code>scripts/merge-schemas.js</Code></List.Item>
            <List.Item><Code>scripts/validate-tenant-bound.js</Code></List.Item>
            <List.Item><Code>scripts/validate-relations.js</Code></List.Item>
            <List.Item><Code>prisma/seed/core-seed.ts</Code></List.Item>
            <List.Item><Code>prisma/seed/tenant-seed.ts</Code></List.Item>
            <List.Item><Code>prisma/seed/demo-seed.ts</Code></List.Item>
          </List>
        </div>

        <Divider />

        <div>
          <Title order={3} mb="md">API Endpoints</Title>
          <List spacing="xs">
            <List.Item><Code>POST /api/setup/test-connection</Code> - Veritabanı bağlantı testi</List.Item>
            <List.Item><Code>POST /api/setup/create-database</Code> - Veritabanı oluşturma</List.Item>
            <List.Item><Code>POST /api/setup/schema-merge</Code> - Schema merge</List.Item>
            <List.Item><Code>POST /api/setup/validate-schema</Code> - Schema validation</List.Item>
            <List.Item><Code>POST /api/setup/db-push</Code> - Database push</List.Item>
            <List.Item><Code>POST /api/setup/generate-client</Code> - Client generate</List.Item>
            <List.Item><Code>POST /api/setup/run-seed</Code> - Seed çalıştırma</List.Item>
            <List.Item><Code>POST /api/setup/reset-database</Code> - Veritabanı sıfırlama</List.Item>
            <List.Item><Code>GET /api/setup/check-access</Code> - Erişim kontrolü</List.Item>
            <List.Item><Code>GET /api/setup/system-status</Code> - Sistem durumu</List.Item>
          </List>
        </div>

        <Divider />

        <div>
          <Title order={3} mb="md">Güvenlik Notları</Title>
          <List spacing="xs">
            <List.Item><strong>Production'da dikkatli kullanın:</strong> Setup sayfası veritabanı sıfırlama ve değiştirme yetkisine sahiptir</List.Item>
            <List.Item><strong>Environment Variable:</strong> Production'da <Code>ALLOW_SETUP_PAGE=true</Code> olmadan erişim reddedilir</List.Item>
            <List.Item><strong>IP Whitelist:</strong> İsterseniz middleware'e IP whitelist ekleyebilirsiniz</List.Item>
            <List.Item><strong>Authentication:</strong> İsterseniz authentication ekleyebilirsiniz</List.Item>
          </List>
        </div>

        <Divider />

        <div>
          <Title order={3} mb="md">Sorun Giderme</Title>
          
          <Title order={4} mb="sm">EPERM Hatası (Windows)</Title>
          <Text mb="sm">Windows'ta dosya kilidi hatası genellikle zararsızdır:</Text>
          <List spacing="xs" mb="md">
            <List.Item>Prisma Studio'yu kapatın</List.Item>
            <List.Item>Diğer Prisma process'lerini kapatın</List.Item>
            <List.Item>Adımı tekrar çalıştırın</List.Item>
          </List>

          <Title order={4} mb="sm">Veritabanı Bağlantı Hatası</Title>
          <List spacing="xs" mb="md">
            <List.Item>PostgreSQL servisinin çalıştığından emin olun</List.Item>
            <List.Item>Connection string'i kontrol edin</List.Item>
            <List.Item>Kullanıcı izinlerini kontrol edin</List.Item>
          </List>

          <Title order={4} mb="sm">Schema Validation Hatası</Title>
          <List spacing="xs">
            <List.Item>Tüm modellerde <Code>tenantId</Code> ve <Code>companyId</Code> olduğundan emin olun</List.Item>
            <List.Item>Cross-module relation'ları whitelist'e göre kontrol edin</List.Item>
            <List.Item>Module contract'ları güncel olduğundan emin olun</List.Item>
          </List>
        </div>
      </Stack>
    </Paper>
  );
}


