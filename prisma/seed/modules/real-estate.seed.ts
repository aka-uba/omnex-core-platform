/**
 * Real Estate Module Seeder
 */

import { Prisma } from '@prisma/tenant-client';
import { ModuleSeeder, SeederContext, SeederResult, generateDemoId, randomChoice, randomDecimal, randomDate } from './base-seeder';

export class RealEstateSeeder implements ModuleSeeder {
  moduleSlug = 'real-estate';
  moduleName = 'Real Estate';
  description = 'Gayrimenkul yönetimi demo verileri';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug } = ctx;
    let itemsCreated = 0;
    const details: Record<string, number> = {};

    try {
      // Properties
      const propertiesData = [
        { name: 'Deniz Apartmanı', type: 'apartment', code: 'PROP-DEMO-001', address: 'Sahil Caddesi No: 45', city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Fenerbahçe', totalUnits: 12, monthlyFee: 2500, description: 'Deniz manzaralı lüks apartman' },
        { name: 'Park Residence', type: 'complex', code: 'PROP-DEMO-002', address: 'Park Sokak No: 12', city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Etiler', totalUnits: 24, monthlyFee: 3500, description: 'Parkın yanında prestijli konut' },
        { name: 'Yeşil Vadi Sitesi', type: 'complex', code: 'PROP-DEMO-003', address: 'Vadi Yolu No: 78', city: 'İstanbul', district: 'Sarıyer', neighborhood: 'Maslak', totalUnits: 48, monthlyFee: 4000, description: 'Doğayla iç içe yaşam alanı' },
      ];

      const properties: any[] = [];
      for (let idx = 0; idx < propertiesData.length; idx++) {
        const p = propertiesData[idx]!;
        const created = await tenantPrisma.property.upsert({
          where: { id: generateDemoId(tenantSlug, 'property', String(idx + 1)) },
          update: {},
          create: {
            id: generateDemoId(tenantSlug, 'property', String(idx + 1)),
            tenantId,
            companyId,
            name: p.name,
            type: p.type,
            code: p.code,
            address: p.address,
            city: p.city,
            district: p.district,
            neighborhood: p.neighborhood,
            country: 'TR',
            totalUnits: p.totalUnits,
            monthlyFee: new Prisma.Decimal(p.monthlyFee),
            paymentDay: randomChoice([1, 5, 10, 15]),
            description: p.description,
            isActive: true,
          },
        });
        properties.push(created);
        itemsCreated++;
      }
      details['properties'] = properties.length;

      // Apartments
      const apartments: any[] = [];
      for (const property of properties) {
        const unitCount = property.type === 'apartment' ? 4 : 6;
        for (let i = 1; i <= unitCount; i++) {
          const apartment = await tenantPrisma.apartment.upsert({
            where: {
              propertyId_unitNumber: {
                propertyId: property.id,
                unitNumber: `DEMO-${i}`,
              },
            },
            update: {},
            create: {
              tenantId,
              companyId,
              propertyId: property.id,
              unitNumber: `DEMO-${i}`,
              floor: Math.ceil(i / 2),
              block: i <= 3 ? 'A' : 'B',
              area: new Prisma.Decimal(randomChoice([85, 100, 120, 150, 180])),
              roomCount: randomChoice([2, 3, 3, 4]),
              livingRoom: true,
              bathroomCount: randomChoice([1, 2, 2]),
              balcony: Math.random() > 0.3,
              status: randomChoice(['empty', 'rented', 'rented', 'rented']),
              rentPrice: randomDecimal(8000, 25000),
              salePrice: randomDecimal(2000000, 8000000),
              isActive: true,
            },
          });
          apartments.push(apartment);
          itemsCreated++;
        }
      }
      details['apartments'] = apartments.length;

      // RE Tenants (Kiracılar) - with full details
      const tenantNames = [
        {
          tenantType: 'person' as const,
          salutation: 'Herr',
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          email: 'ahmet.yilmaz@demo.com',
          phone: '0212 111 2233',
          mobile: '0532 111 2233',
          street: 'Atatürk Caddesi',
          houseNumber: '45/3',
          postalCode: '34710',
          city: 'İstanbul',
          birthDate: new Date(1985, 5, 15),
          birthPlace: 'İstanbul',
          nationality: 'TR',
          taxNumber: '12345678901',
        },
        {
          tenantType: 'person' as const,
          salutation: 'Frau',
          firstName: 'Ayşe',
          lastName: 'Demir',
          email: 'ayse.demir@demo.com',
          phone: '0212 222 3344',
          mobile: '0533 222 3344',
          street: 'İstiklal Caddesi',
          houseNumber: '123',
          postalCode: '34430',
          city: 'İstanbul',
          birthDate: new Date(1990, 2, 22),
          birthPlace: 'Ankara',
          nationality: 'TR',
          taxNumber: '23456789012',
        },
        {
          tenantType: 'person' as const,
          salutation: 'Herr',
          firstName: 'Mehmet',
          lastName: 'Kaya',
          email: 'mehmet.kaya@demo.com',
          phone: '0312 333 4455',
          mobile: '0534 333 4455',
          street: 'Kızılay Sokak',
          houseNumber: '78/A',
          postalCode: '06420',
          city: 'Ankara',
          birthDate: new Date(1978, 8, 10),
          birthPlace: 'Konya',
          nationality: 'TR',
          taxNumber: '34567890123',
        },
        {
          tenantType: 'company' as const,
          companyName: 'Özkan Ticaret Ltd. Şti.',
          email: 'info@ozkanticaret.demo.com',
          phone: '0232 444 5566',
          mobile: '0535 444 5566',
          street: 'Konak Meydanı',
          houseNumber: '5',
          postalCode: '35220',
          city: 'İzmir',
          taxNumber: '45678901234',
        },
        {
          tenantType: 'person' as const,
          salutation: 'Herr',
          firstName: 'Ali',
          lastName: 'Çelik',
          email: 'ali.celik@demo.com',
          phone: '0216 555 6677',
          mobile: '0536 555 6677',
          street: 'Bağdat Caddesi',
          houseNumber: '234/5',
          postalCode: '34740',
          city: 'İstanbul',
          birthDate: new Date(1995, 11, 5),
          birthPlace: 'İstanbul',
          nationality: 'TR',
          taxNumber: '56789012345',
        },
        {
          tenantType: 'person' as const,
          salutation: 'Frau',
          firstName: 'Zeynep',
          lastName: 'Arslan',
          email: 'zeynep.arslan@demo.com',
          phone: '0224 666 7788',
          mobile: '0537 666 7788',
          street: 'Mudanya Yolu',
          houseNumber: '89',
          postalCode: '16050',
          city: 'Bursa',
          birthDate: new Date(1988, 3, 18),
          birthPlace: 'Bursa',
          nationality: 'TR',
          taxNumber: '67890123456',
        },
      ];

      const tenants: any[] = [];
      for (let idx = 0; idx < tenantNames.length; idx++) {
        const t = tenantNames[idx]!;
        const created = await tenantPrisma.tenant.upsert({
          where: { id: generateDemoId(tenantSlug, 're-tenant', String(idx + 1)) },
          update: {
            tenantType: t.tenantType,
            companyName: t.tenantType === 'company' ? (t as any).companyName : null,
            salutation: t.tenantType === 'person' ? (t as any).salutation : null,
            firstName: t.tenantType === 'person' ? (t as any).firstName : null,
            lastName: t.tenantType === 'person' ? (t as any).lastName : null,
            email: t.email,
            phone: t.phone,
            mobile: t.mobile,
            street: t.street,
            houseNumber: t.houseNumber,
            postalCode: t.postalCode,
            city: t.city,
            birthDate: t.tenantType === 'person' ? (t as any).birthDate : null,
            birthPlace: t.tenantType === 'person' ? (t as any).birthPlace : null,
            nationality: t.tenantType === 'person' ? (t as any).nationality : null,
            taxNumber: t.taxNumber,
          },
          create: {
            id: generateDemoId(tenantSlug, 're-tenant', String(idx + 1)),
            tenantId,
            companyId,
            tenantNumber: `KRC-DEMO-${String(idx + 1).padStart(4, '0')}`,
            tenantType: t.tenantType,
            companyName: t.tenantType === 'company' ? (t as any).companyName : null,
            salutation: t.tenantType === 'person' ? (t as any).salutation : null,
            firstName: t.tenantType === 'person' ? (t as any).firstName : null,
            lastName: t.tenantType === 'person' ? (t as any).lastName : null,
            email: t.email,
            phone: t.phone,
            mobile: t.mobile,
            street: t.street,
            houseNumber: t.houseNumber,
            postalCode: t.postalCode,
            city: t.city,
            birthDate: t.tenantType === 'person' ? (t as any).birthDate : null,
            birthPlace: t.tenantType === 'person' ? (t as any).birthPlace : null,
            nationality: t.tenantType === 'person' ? (t as any).nationality : null,
            taxNumber: t.taxNumber,
            moveInDate: randomDate(new Date(2022, 0, 1), new Date(2024, 6, 1)),
            paymentScore: randomDecimal(70, 100),
            contactScore: randomDecimal(80, 100),
            maintenanceScore: randomDecimal(75, 100),
            overallScore: randomDecimal(75, 100),
            notes: t.tenantType === 'company'
              ? `Demo şirket kiracı: ${(t as any).companyName}`
              : `Demo kiracı: ${(t as any).firstName} ${(t as any).lastName}`,
            isActive: true,
          },
        });
        tenants.push(created);
        itemsCreated++;
      }
      details['tenants'] = tenants.length;

      // Contracts
      const rentedApartments = apartments.filter((a) => a.status === 'rented');
      const contracts: any[] = [];

      for (let idx = 0; idx < Math.min(6, rentedApartments.length); idx++) {
        const apt = rentedApartments[idx];
        const contract = await tenantPrisma.contract.upsert({
          where: {
            tenantId_contractNumber: {
              tenantId,
              contractNumber: `CONT-DEMO-${String(idx + 1).padStart(4, '0')}`,
            },
          },
          update: {},
          create: {
            tenantId,
            companyId,
            apartmentId: apt.id,
            tenantRecordId: tenants[idx % tenants.length].id,
            contractNumber: `CONT-DEMO-${String(idx + 1).padStart(4, '0')}`,
            type: 'rental',
            startDate: randomDate(new Date(2023, 0, 1), new Date(2024, 0, 1)),
            endDate: randomDate(new Date(2025, 0, 1), new Date(2026, 0, 1)),
            rentAmount: apt.rentPrice || new Prisma.Decimal(10000),
            deposit: new Prisma.Decimal(Number(apt.rentPrice || 10000) * 2),
            currency: 'TRY',
            paymentType: randomChoice(['bank_transfer', 'auto_debit']),
            paymentDay: randomChoice([1, 5, 10, 15]),
            autoRenewal: Math.random() > 0.5,
            increaseRate: new Prisma.Decimal(0.25),
            status: 'active',
            isActive: true,
          },
        });
        contracts.push(contract);
        itemsCreated++;
      }
      details['contracts'] = contracts.length;

      // Payments
      let paymentsCreated = 0;
      for (const contract of contracts) {
        for (let month = 0; month < 3; month++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() - month);
          dueDate.setDate(contract.paymentDay || 5);

          await tenantPrisma.payment.create({
            data: {
              tenantId,
              companyId,
              apartmentId: contract.apartmentId,
              contractId: contract.id,
              tenantRecordId: contract.tenantRecordId,
              type: 'rent',
              amount: contract.rentAmount,
              currency: 'TRY',
              dueDate,
              paidDate: month > 0 ? dueDate : null,
              status: month > 0 ? 'paid' : randomChoice(['pending', 'paid']),
              totalAmount: contract.rentAmount,
              paymentMethod: month > 0 ? randomChoice(['bank_transfer', 'cash']) : null,
              isAutoGenerated: false,
            },
          });
          paymentsCreated++;
          itemsCreated++;
        }
      }
      details['payments'] = paymentsCreated;

      // Appointments
      const appointmentTypes = ['viewing', 'delivery', 'maintenance', 'inspection'];
      let appointmentsCreated = 0;

      for (let idx = 0; idx < Math.min(8, apartments.length); idx++) {
        const apt = apartments[idx];
        await tenantPrisma.appointment.create({
          data: {
            tenantId,
            companyId,
            apartmentId: apt.id,
            tenantRecordId: tenants[idx % tenants.length]?.id,
            type: randomChoice(appointmentTypes),
            title: `${apt.unitNumber} No'lu Daire - ${randomChoice(['Gösterim', 'Teslim', 'Bakım', 'Kontrol'])}`,
            description: 'Demo randevu kaydı',
            startDate: randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
            endDate: randomDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            duration: randomChoice([30, 60, 90]),
            status: randomChoice(['scheduled', 'scheduled', 'completed']),
            followUpRequired: Math.random() > 0.7,
          },
        });
        appointmentsCreated++;
        itemsCreated++;
      }
      details['appointments'] = appointmentsCreated;

      // RE Staff
      const staffRoles = ['manager', 'agent', 'accountant', 'maintenance'];
      const staffNames = ['Murat Şahin', 'Elif Yıldız', 'Burak Aydın', 'Selin Koç'];
      let staffCreated = 0;

      for (let idx = 0; idx < staffNames.length; idx++) {
        const name = staffNames[idx]!;
        await tenantPrisma.realEstateStaff.upsert({
          where: {
            tenantId_userId: {
              tenantId,
              userId: `demo-staff-${idx + 1}`,
            },
          },
          update: {},
          create: {
            tenantId,
            companyId,
            userId: `demo-staff-${idx + 1}`,
            name,
            email: `${name.toLowerCase().replace(' ', '.')}@demo.com`,
            phone: `053${idx + 1} ${idx + 1}${idx + 1}${idx + 1} ${idx + 2}${idx + 2}${idx + 2}${idx + 2}`,
            staffType: 'internal',
            role: staffRoles[idx]!,
            propertyIds: properties.slice(0, idx + 1).map((p) => p.id),
            assignedUnits: (idx + 1) * 5,
            collectionRate: randomDecimal(85, 98),
            averageVacancyDays: randomDecimal(5, 30),
            customerSatisfaction: randomDecimal(80, 100),
            isActive: true,
          },
        });
        staffCreated++;
        itemsCreated++;
      }
      details['staff'] = staffCreated;

      // Contract Templates (Sözleşme Şablonları)
      const contractTemplatesData = [
        { name: 'Standart Kira Sözleşmesi', type: 'rental', description: 'Konut kiralama için standart sözleşme şablonu' },
        { name: 'Ticari Kira Sözleşmesi', type: 'commercial', description: 'İşyeri kiralama sözleşmesi şablonu' },
        { name: 'Kısa Dönem Kiralama', type: 'short_term', description: 'Kısa süreli kiralama sözleşmesi' },
      ];
      let contractTemplatesCreated = 0;

      for (let idx = 0; idx < contractTemplatesData.length; idx++) {
        const ct = contractTemplatesData[idx]!;
        await tenantPrisma.contractTemplate.upsert({
          where: { id: generateDemoId(tenantSlug, 'contract-template', String(idx + 1)) },
          update: {},
          create: {
            id: generateDemoId(tenantSlug, 'contract-template', String(idx + 1)),
            tenantId,
            companyId,
            name: ct.name,
            type: ct.type,
            description: ct.description,
            content: `<h1>${ct.name}</h1><p>Bu bir demo sözleşme şablonudur.</p><p>Taraflar arasında aşağıdaki şartlarda anlaşmaya varılmıştır...</p>`,
            variables: JSON.stringify(['kiracı_adı', 'ev_sahibi_adı', 'adres', 'kira_bedeli', 'depozito', 'başlangıç_tarihi', 'bitiş_tarihi']),
            isDefault: idx === 0,
            isActive: true,
          },
        });
        contractTemplatesCreated++;
        itemsCreated++;
      }
      details['contractTemplates'] = contractTemplatesCreated;

      // Email Templates (E-posta Şablonları)
      const emailTemplatesData = [
        { name: 'Hoşgeldiniz E-postası', category: 'welcome', subject: 'Hoş Geldiniz - {{property_name}}' },
        { name: 'Kira Hatırlatma', category: 'reminder', subject: 'Kira Ödeme Hatırlatması - {{month}}' },
        { name: 'Sözleşme Yenileme', category: 'agreement', subject: 'Sözleşme Yenileme Bildirimi' },
        { name: 'Bakım Bildirimi', category: 'announcement', subject: 'Bakım Çalışması Bildirimi' },
      ];
      let emailTemplatesCreated = 0;

      for (let idx = 0; idx < emailTemplatesData.length; idx++) {
        const et = emailTemplatesData[idx]!;
        await tenantPrisma.emailTemplate.upsert({
          where: {
            tenantId_name: {
              tenantId,
              name: et.name,
            }
          },
          update: {},
          create: {
            id: generateDemoId(tenantSlug, 'email-template', String(idx + 1)),
            tenantId,
            companyId,
            name: et.name,
            category: et.category,
            subject: et.subject,
            htmlContent: `<html><body><h2>${et.name}</h2><p>Sayın {{tenant_name}},</p><p>Bu bir demo e-posta şablonudur.</p><p>Saygılarımızla,<br/>{{company_name}}</p></body></html>`,
            variables: JSON.stringify(['tenant_name', 'property_name', 'company_name', 'month', 'amount']),
            isDefault: idx === 0,
            isActive: true,
          },
        });
        emailTemplatesCreated++;
        itemsCreated++;
      }
      details['emailTemplates'] = emailTemplatesCreated;

      // Email Campaigns - Requires EmailTemplate first
      const firstEmailTemplate = await tenantPrisma.emailTemplate.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });

      if (firstEmailTemplate) {
        const emailCampaignsData = [
          { name: 'Yeni Yıl Kutlaması', status: 'sent' },
          { name: 'Kira Artış Bildirimi 2025', status: 'draft' },
          { name: 'Bakım Takvimi Duyurusu', status: 'scheduled' },
        ];
        let emailCampaignsCreated = 0;

        for (let idx = 0; idx < emailCampaignsData.length; idx++) {
          const ec = emailCampaignsData[idx]!;
          await tenantPrisma.emailCampaign.create({
            data: {
              id: generateDemoId(tenantSlug, 'email-campaign', String(idx + 1)),
              tenantId,
              companyId,
              templateId: firstEmailTemplate.id,
              name: ec.name,
              recipients: JSON.stringify([
                { email: 'demo1@example.com', name: 'Demo User 1' },
                { email: 'demo2@example.com', name: 'Demo User 2' },
              ]),
              recipientCount: randomChoice([10, 25, 50, 100]),
              status: ec.status,
              sentCount: ec.status === 'sent' ? randomChoice([8, 20, 45, 95]) : 0,
              openedCount: ec.status === 'sent' ? randomChoice([5, 15, 30, 60]) : 0,
              clickedCount: ec.status === 'sent' ? randomChoice([2, 8, 15, 30]) : 0,
              scheduledAt: ec.status === 'scheduled' ? randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) : null,
              sentAt: ec.status === 'sent' ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()) : null,
            },
          });
          emailCampaignsCreated++;
          itemsCreated++;
        }
        details['emailCampaigns'] = emailCampaignsCreated;
      }

      // Agreement Report Templates (Anlaşma Raporu Şablonları)
      const agreementReportTemplatesData = [
        { name: 'Patron Raporu', category: 'boss', description: 'Üst yönetime sunulan anlaşma raporu' },
        { name: 'Mal Sahibi Raporu', category: 'owner', description: 'Ev sahibine gönderilen anlaşma raporu' },
        { name: 'Kiracı Raporu', category: 'tenant', description: 'Kiracıya iletilen anlaşma raporu' },
        { name: 'Dahili Rapor', category: 'internal', description: 'İç kullanım için anlaşma raporu' },
      ];
      let agreementReportTemplatesCreated = 0;

      for (let idx = 0; idx < agreementReportTemplatesData.length; idx++) {
        const art = agreementReportTemplatesData[idx]!;
        await tenantPrisma.agreementReportTemplate.upsert({
          where: {
            tenantId_name: {
              tenantId,
              name: art.name,
            }
          },
          update: {},
          create: {
            id: generateDemoId(tenantSlug, 'agreement-report-template', String(idx + 1)),
            tenantId,
            companyId,
            name: art.name,
            category: art.category,
            description: art.description,
            content: `<h1>${art.name}</h1><p>Daire: {{apartment}}</p><p>Kira: {{rent}}</p><p>Depozito: {{deposit}}</p>`,
            variables: JSON.stringify(['apartment', 'rent', 'deposit', 'tenant_name', 'delivery_date']),
            isDefault: idx === 0,
            isActive: true,
          },
        });
        agreementReportTemplatesCreated++;
        itemsCreated++;
      }
      details['agreementReportTemplates'] = agreementReportTemplatesCreated;

      // Agreement Reports (Anlaşma Raporları) - Requires Apartment and optionally Contract
      const agreementTypes = ['boss', 'owner', 'tenant', 'internal'];
      const agreementStatuses = ['pre_agreement', 'signed', 'delivery_scheduled', 'deposit_received'];
      let agreementReportsCreated = 0;

      for (let idx = 0; idx < Math.min(4, apartments.length); idx++) {
        const apt = apartments[idx];
        const contract = contracts[idx % contracts.length];

        await tenantPrisma.agreementReport.create({
          data: {
            id: generateDemoId(tenantSlug, 'agreement-report', String(idx + 1)),
            tenantId,
            companyId,
            type: agreementTypes[idx % agreementTypes.length]!,
            apartmentId: apt.id,
            contractId: contract?.id,
            agreementStatus: agreementStatuses[idx % agreementStatuses.length]!,
            rentAmount: apt.rentPrice || randomDecimal(8000, 25000),
            deposit: randomDecimal(16000, 50000),
            deliveryDate: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            contractDate: idx < 2 ? new Date() : null,
            specialTerms: 'Demo özel şartlar',
            nextSteps: 'Demo sonraki adımlar',
            recipients: JSON.stringify([
              { email: 'demo@example.com', name: 'Demo Alıcı', type: 'to' },
            ]),
            attachments: [],
            status: idx < 2 ? 'sent' : 'draft',
            sentAt: idx < 2 ? new Date() : null,
          },
        });
        agreementReportsCreated++;
        itemsCreated++;
      }
      details['agreementReports'] = agreementReportsCreated;

      // Real Estate Maintenance Records (Gayrimenkul Bakım Kayıtları)
      const maintenanceTypes = ['preventive', 'corrective', 'emergency'];
      const maintenanceStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      let maintenanceRecordsCreated = 0;

      for (let idx = 0; idx < Math.min(6, apartments.length); idx++) {
        const apt = apartments[idx];
        const status = randomChoice(maintenanceStatuses);
        await tenantPrisma.realEstateMaintenanceRecord.create({
          data: {
            tenantId,
            companyId,
            apartmentId: apt.id,
            type: randomChoice(maintenanceTypes),
            title: `${apt.unitNumber} No'lu Daire - ${randomChoice(['Tesisat', 'Elektrik', 'Boya', 'Tadilat'])} Bakımı`,
            description: 'Demo bakım kaydı',
            status,
            scheduledDate: randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
            startDate: status !== 'scheduled' ? new Date() : null,
            endDate: status === 'completed' ? new Date() : null,
            estimatedCost: randomDecimal(500, 5000),
            actualCost: status === 'completed' ? randomDecimal(400, 4500) : null,
            documents: [],
            photos: [],
          },
        });
        maintenanceRecordsCreated++;
        itemsCreated++;
      }
      details['maintenanceRecords'] = maintenanceRecordsCreated;

      // Bulk Operations (Toplu İşlemler)
      const bulkOperationsData = [
        { type: 'rent_increase', title: 'Yıllık Kira Artışı', status: 'completed', description: 'Yıllık kira artışı uygulaması' },
        { type: 'payment_generate', title: 'Ödeme Oluşturma', status: 'completed', description: 'Toplu ödeme oluşturma işlemi' },
        { type: 'contract_renewal', title: 'Sözleşme Yenileme', status: 'pending', description: 'Sözleşme yenileme bildirimleri' },
      ];
      let bulkOperationsCreated = 0;

      for (let idx = 0; idx < bulkOperationsData.length; idx++) {
        const bo = bulkOperationsData[idx]!;
        await tenantPrisma.bulkOperation.create({
          data: {
            id: generateDemoId(tenantSlug, 'bulk-operation', String(idx + 1)),
            tenantId,
            companyId,
            createdBy: ctx.adminUserId,
            type: bo.type,
            title: bo.title,
            description: bo.description,
            status: bo.status,
            affectedCount: randomChoice([10, 25, 50]),
            successCount: bo.status === 'completed' ? randomChoice([9, 24, 48]) : 0,
            failedCount: bo.status === 'completed' ? randomChoice([1, 1, 2]) : 0,
            parameters: { increaseRate: 0.25, sendEmail: true },
            results: bo.status === 'completed' ? { message: 'İşlem başarıyla tamamlandı' } : null,
            startedAt: bo.status === 'completed' ? randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()) : null,
            completedAt: bo.status === 'completed' ? new Date() : null,
          },
        });
        bulkOperationsCreated++;
        itemsCreated++;
      }
      details['bulkOperations'] = bulkOperationsCreated;

      return { success: true, itemsCreated, details };
    } catch (error: any) {
      return { success: false, itemsCreated, error: error.message, details };
    }
  }

  async unseed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma } = ctx;
    let itemsDeleted = 0;

    try {
      // Delete in reverse order of dependencies

      // Bulk Operations
      const bulkOpResult = await tenantPrisma.bulkOperation.deleteMany({
        where: { id: { contains: '-demo-bulk-operation-' } },
      });
      itemsDeleted += bulkOpResult.count;

      // Real Estate Maintenance Records
      const reMaintenanceResult = await tenantPrisma.realEstateMaintenanceRecord.deleteMany({
        where: { description: 'Demo bakım kaydı' },
      });
      itemsDeleted += reMaintenanceResult.count;

      // Agreement Reports
      const agreementReportResult = await tenantPrisma.agreementReport.deleteMany({
        where: { id: { contains: '-demo-agreement-report-' } },
      });
      itemsDeleted += agreementReportResult.count;

      // Agreement Report Templates
      const agreementReportTemplateResult = await tenantPrisma.agreementReportTemplate.deleteMany({
        where: { id: { contains: '-demo-agreement-report-template-' } },
      });
      itemsDeleted += agreementReportTemplateResult.count;

      // Email Campaigns
      const emailCampaignResult = await tenantPrisma.emailCampaign.deleteMany({
        where: { id: { contains: '-demo-email-campaign-' } },
      });
      itemsDeleted += emailCampaignResult.count;

      // Email Templates
      const emailTemplateResult = await tenantPrisma.emailTemplate.deleteMany({
        where: { id: { contains: '-demo-email-template-' } },
      });
      itemsDeleted += emailTemplateResult.count;

      // Contract Templates
      const contractTemplateResult = await tenantPrisma.contractTemplate.deleteMany({
        where: { id: { contains: '-demo-contract-template-' } },
      });
      itemsDeleted += contractTemplateResult.count;

      // Appointments
      const appointmentResult = await tenantPrisma.appointment.deleteMany({
        where: { description: 'Demo randevu kaydı' },
      });
      itemsDeleted += appointmentResult.count;

      // Payments (RE payments have contractId)
      const paymentResult = await tenantPrisma.payment.deleteMany({
        where: { contract: { contractNumber: { startsWith: 'CONT-DEMO-' } } },
      });
      itemsDeleted += paymentResult.count;

      // Contracts
      const contractResult = await tenantPrisma.contract.deleteMany({
        where: { contractNumber: { startsWith: 'CONT-DEMO-' } },
      });
      itemsDeleted += contractResult.count;

      // RE Staff
      const staffResult = await tenantPrisma.realEstateStaff.deleteMany({
        where: { userId: { startsWith: 'demo-staff-' } },
      });
      itemsDeleted += staffResult.count;

      // RE Tenants
      const tenantResult = await tenantPrisma.tenant.deleteMany({
        where: { id: { contains: '-demo-re-tenant-' } },
      });
      itemsDeleted += tenantResult.count;

      // Apartments
      const apartmentResult = await tenantPrisma.apartment.deleteMany({
        where: { unitNumber: { startsWith: 'DEMO-' } },
      });
      itemsDeleted += apartmentResult.count;

      // Properties
      const propertyResult = await tenantPrisma.property.deleteMany({
        where: { id: { contains: '-demo-property-' } },
      });
      itemsDeleted += propertyResult.count;

      return { success: true, itemsCreated: 0, itemsDeleted };
    } catch (error: any) {
      return { success: false, itemsCreated: 0, itemsDeleted, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const propertyCount = await tenantPrisma.property.count({
      where: { id: { contains: '-demo-property-' } },
    });

    const apartmentCount = await tenantPrisma.apartment.count({
      where: { unitNumber: { startsWith: 'DEMO-' } },
    });

    const count = propertyCount + apartmentCount;
    return { hasData: count > 0, count };
  }
}
