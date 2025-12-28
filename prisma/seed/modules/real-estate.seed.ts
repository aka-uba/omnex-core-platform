/**
 * Real Estate Module Seeder
 *
 * Bu seeder tamamen birbirine bağlı veriler oluşturur:
 * - Property → Apartment → Contract → Tenant → Payments
 * - PropertyExpenses (Yan Giderler)
 * - SideCostReconciliation (Yıl Sonu Mutabakat)
 */

import { Prisma } from '@prisma/tenant-client';
import { ModuleSeeder, SeederContext, SeederResult, generateDemoId, randomChoice, randomDecimal, randomDate } from './base-seeder';

export class RealEstateSeeder implements ModuleSeeder {
  moduleSlug = 'real-estate';
  moduleName = 'Real Estate';
  description = 'Gayrimenkul yönetimi demo verileri - Tamamen birbirine bağlı';

  async seed(ctx: SeederContext): Promise<SeederResult> {
    const { tenantPrisma, tenantId, companyId, tenantSlug } = ctx;
    let itemsCreated = 0;
    const details: Record<string, number> = {};

    try {
      // ============================================
      // 1. PROPERTIES (Binalar/Apartmanlar)
      // ============================================
      const propertiesData = [
        {
          name: 'Deniz Apartmanı',
          type: 'apartment',
          code: 'PROP-001',
          address: 'Sahil Caddesi No: 45',
          city: 'İstanbul',
          district: 'Kadıköy',
          neighborhood: 'Fenerbahçe',
          totalUnits: 6,
          monthlyFee: 2500,
          paymentDay: 5,
          description: 'Deniz manzaralı lüks apartman',
          constructionYear: 2018,
          floorCount: 3,
          livingArea: 720,
          landArea: 450,
        },
        {
          name: 'Park Residence',
          type: 'complex',
          code: 'PROP-002',
          address: 'Park Sokak No: 12',
          city: 'İstanbul',
          district: 'Beşiktaş',
          neighborhood: 'Etiler',
          totalUnits: 6,
          monthlyFee: 3500,
          paymentDay: 1,
          description: 'Parkın yanında prestijli konut',
          constructionYear: 2020,
          floorCount: 4,
          livingArea: 960,
          landArea: 600,
        },
        {
          name: 'Yeşil Vadi Sitesi',
          type: 'complex',
          code: 'PROP-003',
          address: 'Vadi Yolu No: 78',
          city: 'İstanbul',
          district: 'Sarıyer',
          neighborhood: 'Maslak',
          totalUnits: 6,
          monthlyFee: 4000,
          paymentDay: 10,
          description: 'Doğayla iç içe yaşam alanı',
          constructionYear: 2015,
          floorCount: 5,
          livingArea: 1200,
          landArea: 800,
        },
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
            paymentDay: p.paymentDay,
            description: p.description,
            constructionYear: p.constructionYear,
            floorCount: p.floorCount,
            livingArea: new Prisma.Decimal(p.livingArea),
            landArea: new Prisma.Decimal(p.landArea),
            isActive: true,
          },
        });
        properties.push(created);
        itemsCreated++;
      }
      details['properties'] = properties.length;

      // ============================================
      // 2. APARTMENTS (Daireler) - Her binada 6 daire
      // ============================================
      const apartmentConfigs = [
        // Deniz Apartmanı daireleri
        { unitNumber: '1', floor: 1, block: 'A', area: 85, roomCount: 2, rentPrice: 15000, coldRent: 12000, additionalCosts: 2000, heatingCosts: 1000 },
        { unitNumber: '2', floor: 1, block: 'A', area: 100, roomCount: 3, rentPrice: 18000, coldRent: 14000, additionalCosts: 2500, heatingCosts: 1500 },
        { unitNumber: '3', floor: 2, block: 'A', area: 120, roomCount: 3, rentPrice: 22000, coldRent: 17000, additionalCosts: 3000, heatingCosts: 2000 },
        { unitNumber: '4', floor: 2, block: 'A', area: 150, roomCount: 4, rentPrice: 28000, coldRent: 22000, additionalCosts: 3500, heatingCosts: 2500 },
        { unitNumber: '5', floor: 3, block: 'A', area: 180, roomCount: 4, rentPrice: 35000, coldRent: 28000, additionalCosts: 4000, heatingCosts: 3000 },
        { unitNumber: '6', floor: 3, block: 'A', area: 200, roomCount: 5, rentPrice: 42000, coldRent: 34000, additionalCosts: 4500, heatingCosts: 3500 },
      ];

      const apartments: any[] = [];
      for (let propIdx = 0; propIdx < properties.length; propIdx++) {
        const property = properties[propIdx];
        for (let aptIdx = 0; aptIdx < 6; aptIdx++) {
          const config = apartmentConfigs[aptIdx]!;
          // Her property için farklı fiyatlar
          const priceMultiplier = propIdx === 0 ? 1 : propIdx === 1 ? 1.2 : 1.4;

          const apartment = await tenantPrisma.apartment.upsert({
            where: {
              propertyId_unitNumber: {
                propertyId: property.id,
                unitNumber: config.unitNumber,
              },
            },
            update: {},
            create: {
              tenantId,
              companyId,
              propertyId: property.id,
              unitNumber: config.unitNumber,
              floor: config.floor,
              block: config.block,
              area: new Prisma.Decimal(config.area),
              roomCount: config.roomCount,
              livingRoom: true,
              bathroomCount: config.roomCount > 3 ? 2 : 1,
              balcony: config.floor > 1,
              status: 'rented', // Tüm daireler kiralık (bağlantı için)
              rentPrice: new Prisma.Decimal(Math.round(config.rentPrice * priceMultiplier)),
              coldRent: new Prisma.Decimal(Math.round(config.coldRent * priceMultiplier)),
              additionalCosts: new Prisma.Decimal(Math.round(config.additionalCosts * priceMultiplier)),
              heatingCosts: new Prisma.Decimal(Math.round(config.heatingCosts * priceMultiplier)),
              deposit: new Prisma.Decimal(Math.round(config.rentPrice * priceMultiplier * 2)),
              isActive: true,
            },
          });
          apartments.push({ ...apartment, propertyIndex: propIdx, apartmentIndex: aptIdx });
          itemsCreated++;
        }
      }
      details['apartments'] = apartments.length;

      // ============================================
      // 3. TENANTS (Kiracılar) - 18 kiracı (her daire için bir kiracı)
      // ============================================
      const tenantNames = [
        // Property 1 - Deniz Apartmanı kiracıları
        { tenantType: 'person', salutation: 'Herr', firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet.yilmaz@demo.com', phone: '0212 111 2233', mobile: '0532 111 2233', street: 'Atatürk Caddesi', houseNumber: '45/3', postalCode: '34710', city: 'İstanbul', birthDate: new Date(1985, 5, 15), birthPlace: 'İstanbul', nationality: 'TR', taxNumber: '12345678901' },
        { tenantType: 'person', salutation: 'Frau', firstName: 'Ayşe', lastName: 'Demir', email: 'ayse.demir@demo.com', phone: '0212 222 3344', mobile: '0533 222 3344', street: 'İstiklal Caddesi', houseNumber: '123', postalCode: '34430', city: 'İstanbul', birthDate: new Date(1990, 2, 22), birthPlace: 'Ankara', nationality: 'TR', taxNumber: '23456789012' },
        { tenantType: 'person', salutation: 'Herr', firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet.kaya@demo.com', phone: '0312 333 4455', mobile: '0534 333 4455', street: 'Kızılay Sokak', houseNumber: '78/A', postalCode: '06420', city: 'Ankara', birthDate: new Date(1978, 8, 10), birthPlace: 'Konya', nationality: 'TR', taxNumber: '34567890123' },
        { tenantType: 'company', companyName: 'Özkan Ticaret Ltd. Şti.', email: 'info@ozkanticaret.demo.com', phone: '0232 444 5566', mobile: '0535 444 5566', street: 'Konak Meydanı', houseNumber: '5', postalCode: '35220', city: 'İzmir', taxNumber: '45678901234' },
        { tenantType: 'person', salutation: 'Herr', firstName: 'Ali', lastName: 'Çelik', email: 'ali.celik@demo.com', phone: '0216 555 6677', mobile: '0536 555 6677', street: 'Bağdat Caddesi', houseNumber: '234/5', postalCode: '34740', city: 'İstanbul', birthDate: new Date(1995, 11, 5), birthPlace: 'İstanbul', nationality: 'TR', taxNumber: '56789012345' },
        { tenantType: 'person', salutation: 'Frau', firstName: 'Zeynep', lastName: 'Arslan', email: 'zeynep.arslan@demo.com', phone: '0224 666 7788', mobile: '0537 666 7788', street: 'Mudanya Yolu', houseNumber: '89', postalCode: '16050', city: 'Bursa', birthDate: new Date(1988, 3, 18), birthPlace: 'Bursa', nationality: 'TR', taxNumber: '67890123456' },

        // Property 2 - Park Residence kiracıları
        { tenantType: 'person', salutation: 'Herr', firstName: 'Mustafa', lastName: 'Öztürk', email: 'mustafa.ozturk@demo.com', phone: '0212 777 8899', mobile: '0538 777 8899', street: 'Nişantaşı Caddesi', houseNumber: '56', postalCode: '34365', city: 'İstanbul', birthDate: new Date(1982, 7, 25), birthPlace: 'Trabzon', nationality: 'TR', taxNumber: '78901234567' },
        { tenantType: 'person', salutation: 'Frau', firstName: 'Fatma', lastName: 'Yıldırım', email: 'fatma.yildirim@demo.com', phone: '0212 888 9900', mobile: '0539 888 9900', street: 'Bebek Caddesi', houseNumber: '12/A', postalCode: '34342', city: 'İstanbul', birthDate: new Date(1992, 1, 8), birthPlace: 'İstanbul', nationality: 'TR', taxNumber: '89012345678' },
        { tenantType: 'company', companyName: 'Yıldız Danışmanlık A.Ş.', email: 'info@yildizdanismanlik.demo.com', phone: '0212 999 0011', mobile: '0540 999 0011', street: 'Levent Caddesi', houseNumber: '100', postalCode: '34330', city: 'İstanbul', taxNumber: '90123456789' },
        { tenantType: 'person', salutation: 'Herr', firstName: 'Hasan', lastName: 'Şahin', email: 'hasan.sahin@demo.com', phone: '0216 111 2244', mobile: '0541 111 2244', street: 'Fenerbahçe Caddesi', houseNumber: '78', postalCode: '34726', city: 'İstanbul', birthDate: new Date(1975, 9, 12), birthPlace: 'Samsun', nationality: 'TR', taxNumber: '01234567890' },
        { tenantType: 'person', salutation: 'Frau', firstName: 'Elif', lastName: 'Koç', email: 'elif.koc@demo.com', phone: '0216 222 3355', mobile: '0542 222 3355', street: 'Suadiye Caddesi', houseNumber: '45/B', postalCode: '34740', city: 'İstanbul', birthDate: new Date(1998, 4, 30), birthPlace: 'İzmir', nationality: 'TR', taxNumber: '12345678902' },
        { tenantType: 'person', salutation: 'Herr', firstName: 'Emre', lastName: 'Aydın', email: 'emre.aydin@demo.com', phone: '0216 333 4466', mobile: '0543 333 4466', street: 'Caddebostan Caddesi', houseNumber: '23', postalCode: '34728', city: 'İstanbul', birthDate: new Date(1987, 6, 20), birthPlace: 'Ankara', nationality: 'TR', taxNumber: '23456789013' },

        // Property 3 - Yeşil Vadi Sitesi kiracıları
        { tenantType: 'person', salutation: 'Herr', firstName: 'Burak', lastName: 'Demir', email: 'burak.demir@demo.com', phone: '0212 444 5577', mobile: '0544 444 5577', street: 'Maslak Caddesi', houseNumber: '67', postalCode: '34398', city: 'İstanbul', birthDate: new Date(1980, 2, 14), birthPlace: 'Eskişehir', nationality: 'TR', taxNumber: '34567890124' },
        { tenantType: 'company', companyName: 'Teknoloji Sistemleri Ltd.', email: 'info@teknolojisistem.demo.com', phone: '0212 555 6688', mobile: '0545 555 6688', street: 'İTÜ Ayazağa Kampüsü', houseNumber: '1', postalCode: '34469', city: 'İstanbul', taxNumber: '45678901235' },
        { tenantType: 'person', salutation: 'Frau', firstName: 'Selin', lastName: 'Yılmaz', email: 'selin.yilmaz@demo.com', phone: '0212 666 7799', mobile: '0546 666 7799', street: 'Vadistanbul Caddesi', houseNumber: '34', postalCode: '34396', city: 'İstanbul', birthDate: new Date(1993, 11, 7), birthPlace: 'Adana', nationality: 'TR', taxNumber: '56789012346' },
        { tenantType: 'person', salutation: 'Herr', firstName: 'Oğuz', lastName: 'Kara', email: 'oguz.kara@demo.com', phone: '0212 777 8800', mobile: '0547 777 8800', street: 'Sarıyer Caddesi', houseNumber: '89/C', postalCode: '34450', city: 'İstanbul', birthDate: new Date(1984, 8, 23), birthPlace: 'Bursa', nationality: 'TR', taxNumber: '67890123457' },
        { tenantType: 'person', salutation: 'Frau', firstName: 'Deniz', lastName: 'Tan', email: 'deniz.tan@demo.com', phone: '0212 888 9911', mobile: '0548 888 9911', street: 'Tarabya Caddesi', houseNumber: '56', postalCode: '34457', city: 'İstanbul', birthDate: new Date(1996, 5, 16), birthPlace: 'Antalya', nationality: 'TR', taxNumber: '78901234568' },
        { tenantType: 'person', salutation: 'Herr', firstName: 'Can', lastName: 'Özdemir', email: 'can.ozdemir@demo.com', phone: '0212 999 0022', mobile: '0549 999 0022', street: 'Emirgan Caddesi', houseNumber: '12', postalCode: '34467', city: 'İstanbul', birthDate: new Date(1979, 0, 28), birthPlace: 'İzmir', nationality: 'TR', taxNumber: '89012345679' },
      ];

      const tenants: any[] = [];
      for (let idx = 0; idx < tenantNames.length; idx++) {
        const t = tenantNames[idx]!;
        const isCompany = t.tenantType === 'company';

        // Kiracının hangi daireye bağlı olacağını belirle
        const linkedApartment = apartments[idx];
        const moveInDate = new Date(2024, Math.floor(idx / 2), 1 + (idx % 28)); // 2024 yılında farklı tarihlerde

        const created = await tenantPrisma.tenant.upsert({
          where: { id: generateDemoId(tenantSlug, 're-tenant', String(idx + 1)) },
          update: {},
          create: {
            id: generateDemoId(tenantSlug, 're-tenant', String(idx + 1)),
            tenantId,
            companyId,
            tenantNumber: `KRC-${String(idx + 1).padStart(4, '0')}`,
            tenantType: t.tenantType,
            companyName: isCompany ? (t as any).companyName : null,
            salutation: !isCompany ? (t as any).salutation : null,
            firstName: !isCompany ? (t as any).firstName : null,
            lastName: !isCompany ? (t as any).lastName : null,
            email: t.email,
            phone: t.phone,
            mobile: t.mobile,
            street: t.street,
            houseNumber: t.houseNumber,
            postalCode: t.postalCode,
            city: t.city,
            birthDate: !isCompany ? (t as any).birthDate : null,
            birthPlace: !isCompany ? (t as any).birthPlace : null,
            nationality: !isCompany ? (t as any).nationality : null,
            taxNumber: t.taxNumber,
            moveInDate,
            paymentScore: randomDecimal(70, 100),
            contactScore: randomDecimal(80, 100),
            maintenanceScore: randomDecimal(75, 100),
            overallScore: randomDecimal(75, 100),
            notes: isCompany
              ? `Şirket kiracı: ${(t as any).companyName} - ${linkedApartment?.unitNumber} no'lu dairede`
              : `Kiracı: ${(t as any).firstName} ${(t as any).lastName} - ${linkedApartment?.unitNumber} no'lu dairede`,
            isActive: true,
          },
        });
        tenants.push(created);
        itemsCreated++;
      }
      details['tenants'] = tenants.length;

      // ============================================
      // 4. CONTRACTS (Sözleşmeler) - Her kiracı için aktif sözleşme
      // ============================================
      const contracts: any[] = [];
      for (let idx = 0; idx < apartments.length; idx++) {
        const apartment = apartments[idx];
        const tenant = tenants[idx];

        // Sözleşme başlangıç tarihi - kiracının taşınma tarihiyle uyumlu
        const startDate = new Date(2024, Math.floor(idx / 2), 1);
        const endDate = new Date(2025, Math.floor(idx / 2), 1);

        const contract = await tenantPrisma.contract.upsert({
          where: {
            tenantId_contractNumber: {
              tenantId,
              contractNumber: `CONT-${String(idx + 1).padStart(4, '0')}`,
            },
          },
          update: {},
          create: {
            tenantId,
            companyId,
            apartmentId: apartment.id,
            tenantRecordId: tenant.id,
            contractNumber: `CONT-${String(idx + 1).padStart(4, '0')}`,
            type: 'rental',
            startDate,
            endDate,
            rentAmount: apartment.rentPrice || new Prisma.Decimal(15000),
            deposit: apartment.deposit || new Prisma.Decimal(30000),
            currency: 'TRY',
            paymentType: randomChoice(['bank_transfer', 'auto_debit']),
            paymentDay: properties[apartment.propertyIndex]?.paymentDay || 5,
            autoRenewal: true,
            increaseRate: new Prisma.Decimal(0.25),
            status: 'active',
            isActive: true,
            terms: 'Standart kira sözleşmesi şartları geçerlidir.',
            notes: `${apartment.unitNumber} no'lu daire için kira sözleşmesi`,
          },
        });
        contracts.push({ ...contract, apartmentIndex: idx, propertyIndex: apartment.propertyIndex });
        itemsCreated++;
      }
      details['contracts'] = contracts.length;

      // ============================================
      // 5. PAYMENTS (Ödemeler) - 12+ aylık ödeme geçmişi
      // Her sözleşme için: geçmiş ödenmiş, yaklaşan, gecikmiş ödemeler
      // ============================================
      let paymentsCreated = 0;
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      for (let contractIdx = 0; contractIdx < contracts.length; contractIdx++) {
        const contract = contracts[contractIdx];
        const apartment = apartments[contract.apartmentIndex];
        const tenant = tenants[contractIdx];
        const paymentDay = contract.paymentDay || 5;

        // 12 aylık ödeme geçmişi oluştur (6 ay geçmiş + bu ay + 5 ay gelecek)
        for (let monthOffset = -6; monthOffset <= 5; monthOffset++) {
          const paymentDate = new Date(currentYear, currentMonth + monthOffset, paymentDay);

          // Ödeme durumunu belirle
          let status: string;
          let paidDate: Date | null = null;
          let paymentMethod: string | null = null;

          if (monthOffset < 0) {
            // Geçmiş aylar - bazıları ödenmiş, bazıları gecikmiş ödendi
            if (contractIdx % 5 === 0 && monthOffset === -1) {
              // Her 5. kiracının bir önceki ay ödemesi gecikmiş (henüz ödenmemiş)
              status = 'overdue';
            } else {
              status = 'paid';
              // Ödeme tarihi - bazen geç, bazen zamanında
              const daysLate = contractIdx % 3 === 0 ? randomChoice([0, 3, 5, 7]) : 0;
              paidDate = new Date(paymentDate.getTime() + daysLate * 24 * 60 * 60 * 1000);
              paymentMethod = randomChoice(['bank_transfer', 'cash', 'card']);
            }
          } else if (monthOffset === 0) {
            // Bu ay - bazıları ödendi, bazıları bekliyor, bazıları gecikmiş
            if (today.getDate() > paymentDay) {
              // Ödeme günü geçmiş
              if (contractIdx % 4 === 0) {
                status = 'overdue'; // Her 4. kiracı gecikmiş
              } else if (contractIdx % 3 === 0) {
                status = 'pending'; // Her 3. kiracı henüz ödememiş ama gecikme yok
              } else {
                status = 'paid';
                paidDate = new Date(currentYear, currentMonth, paymentDay + randomChoice([0, 1, 2]));
                paymentMethod = randomChoice(['bank_transfer', 'auto_debit']);
              }
            } else {
              // Ödeme günü henüz gelmedi
              status = 'pending';
            }
          } else {
            // Gelecek aylar - hepsi beklemede
            status = 'pending';
          }

          // Kira + ek giderler (coldRent + additionalCosts + heatingCosts)
          const baseRent = Number(contract.rentAmount);
          const extraCharges = [
            { type: 'additional_costs', name: 'Yan Giderler', amount: Number(apartment.additionalCosts || 2000) },
            { type: 'heating', name: 'Isıtma', amount: Number(apartment.heatingCosts || 1500) },
          ];
          const totalExtra = extraCharges.reduce((sum, e) => sum + e.amount, 0);

          await tenantPrisma.payment.create({
            data: {
              tenantId,
              companyId,
              apartmentId: contract.apartmentId,
              contractId: contract.id,
              tenantRecordId: tenant.id,
              type: 'rent',
              amount: new Prisma.Decimal(baseRent),
              currency: 'TRY',
              dueDate: paymentDate,
              paidDate,
              status,
              extraCharges: extraCharges as Prisma.InputJsonValue,
              totalAmount: new Prisma.Decimal(baseRent + totalExtra),
              paymentMethod,
              receiptNumber: paidDate ? `RCP-${contract.contractNumber}-${String(Math.abs(monthOffset) + 1).padStart(2, '0')}` : null,
              isAutoGenerated: true,
              reminderSent: status === 'overdue' || (status === 'pending' && monthOffset === 0),
              notes: monthOffset < 0 ? `${Math.abs(monthOffset)} ay önceki kira ödemesi` : monthOffset === 0 ? 'Bu ayki kira ödemesi' : `${monthOffset} ay sonraki kira ödemesi`,
            },
          });
          paymentsCreated++;
          itemsCreated++;
        }
      }
      details['payments'] = paymentsCreated;

      // ============================================
      // 6. PROPERTY EXPENSES (Bina Giderleri - Yan Giderler)
      // Her bina için 12 aylık gider kaydı
      // ============================================
      const expenseCategories = [
        { category: 'utilities', name: 'Ortak Alan Elektriği', monthlyAmount: 2500 },
        { category: 'utilities', name: 'Su Gideri', monthlyAmount: 1800 },
        { category: 'heating', name: 'Merkezi Isıtma', monthlyAmount: 8000 },
        { category: 'cleaning', name: 'Temizlik Hizmeti', monthlyAmount: 3000 },
        { category: 'maintenance', name: 'Genel Bakım', monthlyAmount: 1500 },
        { category: 'insurance', name: 'Bina Sigortası', monthlyAmount: 800 },
        { category: 'management', name: 'Yönetim Gideri', monthlyAmount: 2000 },
        { category: 'taxes', name: 'Emlak Vergisi', monthlyAmount: 1200 },
      ];

      let expensesCreated = 0;
      for (let propIdx = 0; propIdx < properties.length; propIdx++) {
        const property = properties[propIdx];
        const priceMultiplier = propIdx === 0 ? 1 : propIdx === 1 ? 1.2 : 1.4;

        // 2024 yılı için 12 aylık gider
        for (let month = 0; month < 12; month++) {
          for (const expenseConfig of expenseCategories) {
            const amount = Math.round(expenseConfig.monthlyAmount * priceMultiplier * (0.9 + Math.random() * 0.2)); // ±10% varyasyon

            await tenantPrisma.propertyExpense.create({
              data: {
                tenantId,
                companyId,
                propertyId: property.id,
                name: expenseConfig.name,
                category: expenseConfig.category,
                amount: new Prisma.Decimal(amount),
                expenseDate: new Date(2024, month, 15),
                year: 2024,
                month: month + 1,
                description: `${property.name} - ${expenseConfig.name} - ${month + 1}. ay`,
                invoiceNumber: `INV-${property.code}-${2024}-${String(month + 1).padStart(2, '0')}-${expenseConfig.category.toUpperCase().substring(0, 3)}`,
                vendorName: randomChoice(['Enerjisa', 'İGDAŞ', 'İSKİ', 'Temizlik A.Ş.', 'Sigorta Ltd.', 'Yönetim Hizmetleri']),
                isDistributed: month < currentMonth, // Geçmiş aylar dağıtılmış
                distributionMethod: 'area_based',
                distributedAt: month < currentMonth ? new Date(2024, month, 28) : null,
                isActive: true,
              },
            });
            expensesCreated++;
            itemsCreated++;
          }
        }
      }
      details['propertyExpenses'] = expensesCreated;

      // ============================================
      // 7. SIDE COST RECONCILIATION (Yıl Sonu Mutabakat)
      // Her bina için 2024 yılı mutabakatı
      // ============================================
      let reconciliationsCreated = 0;
      for (let propIdx = 0; propIdx < properties.length; propIdx++) {
        const property = properties[propIdx];

        // Toplam giderleri hesapla
        const propertyExpenses = await tenantPrisma.propertyExpense.findMany({
          where: {
            propertyId: property.id,
            year: 2024,
          },
        });

        const totalExpenses = propertyExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const apartmentCount = 6; // Her binada 6 daire
        const perApartmentShare = totalExpenses / apartmentCount;

        // Her daire için hesaplama detayları
        const propertyApartments = apartments.filter(a => a.propertyIndex === propIdx);
        const details: any[] = propertyApartments.map((apt, idx) => {
          const area = Number(apt.area);
          const totalArea = propertyApartments.reduce((sum, a) => sum + Number(a.area), 0);
          const areaBasedShare = (area / totalArea) * totalExpenses;

          // Bu dairenin yıl boyunca ödediği yan giderler (additionalCosts + heatingCosts * 12)
          const monthlyPaid = Number(apt.additionalCosts || 2000) + Number(apt.heatingCosts || 1500);
          const totalPaid = monthlyPaid * 12;

          // Fark (pozitif = iade, negatif = borç)
          const difference = totalPaid - areaBasedShare;

          return {
            apartmentId: apt.id,
            unitNumber: apt.unitNumber,
            area,
            areaPercentage: (area / totalArea) * 100,
            calculatedShare: areaBasedShare,
            totalPaid,
            difference,
            status: difference >= 0 ? 'refund' : 'debt',
          };
        });

        await tenantPrisma.sideCostReconciliation.upsert({
          where: {
            propertyId_year: {
              propertyId: property.id,
              year: 2024,
            },
          },
          update: {},
          create: {
            tenantId,
            companyId,
            propertyId: property.id,
            year: 2024,
            totalExpenses: new Prisma.Decimal(totalExpenses),
            apartmentCount,
            perApartmentShare: new Prisma.Decimal(perApartmentShare),
            distributionMethod: 'area_based',
            fiscalYearStart: new Date(2024, 0, 1),
            fiscalYearEnd: new Date(2024, 11, 31),
            status: 'calculated',
            calculatedAt: new Date(),
            details: details as Prisma.InputJsonValue,
            notes: `${property.name} - 2024 yılı yan gider mutabakatı. Toplam ${apartmentCount} daire için ${totalExpenses.toLocaleString('tr-TR')} TL gider dağıtılmıştır.`,
          },
        });
        reconciliationsCreated++;
        itemsCreated++;
      }
      details['sideCostReconciliations'] = reconciliationsCreated;

      // ============================================
      // 8. APPOINTMENTS (Randevular)
      // ============================================
      const appointmentTypes = ['viewing', 'delivery', 'maintenance', 'inspection'];
      let appointmentsCreated = 0;

      for (let idx = 0; idx < Math.min(12, apartments.length); idx++) {
        const apt = apartments[idx];
        const tenant = tenants[idx];

        await tenantPrisma.appointment.create({
          data: {
            tenantId,
            companyId,
            apartmentId: apt.id,
            tenantRecordId: tenant.id,
            type: randomChoice(appointmentTypes),
            title: `${apt.unitNumber} No'lu Daire - ${randomChoice(['Gösterim', 'Teslim', 'Bakım', 'Kontrol'])}`,
            description: `${tenant.firstName || tenant.companyName} ile randevu`,
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

      // ============================================
      // 9. RE STAFF (Gayrimenkul Personeli)
      // ============================================
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
            propertyIds: properties.map((p) => p.id),
            assignedUnits: 6,
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

      // ============================================
      // 10. CONTRACT TEMPLATES
      // ============================================
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

      // ============================================
      // 11. EMAIL TEMPLATES
      // ============================================
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

      // ============================================
      // 12. EMAIL CAMPAIGNS
      // ============================================
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
              recipients: JSON.stringify(tenants.map(t => ({
                email: t.email,
                name: t.firstName ? `${t.firstName} ${t.lastName}` : t.companyName,
              }))),
              recipientCount: tenants.length,
              status: ec.status,
              sentCount: ec.status === 'sent' ? tenants.length - 2 : 0,
              openedCount: ec.status === 'sent' ? Math.floor(tenants.length * 0.7) : 0,
              clickedCount: ec.status === 'sent' ? Math.floor(tenants.length * 0.3) : 0,
              scheduledAt: ec.status === 'scheduled' ? randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) : null,
              sentAt: ec.status === 'sent' ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()) : null,
            },
          });
          emailCampaignsCreated++;
          itemsCreated++;
        }
        details['emailCampaigns'] = emailCampaignsCreated;
      }

      // ============================================
      // 13. AGREEMENT REPORT TEMPLATES
      // ============================================
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

      // ============================================
      // 14. AGREEMENT REPORTS
      // ============================================
      const agreementTypes = ['boss', 'owner', 'tenant', 'internal'];
      const agreementStatuses = ['pre_agreement', 'signed', 'delivery_scheduled', 'deposit_received'];
      let agreementReportsCreated = 0;

      for (let idx = 0; idx < Math.min(6, apartments.length); idx++) {
        const apt = apartments[idx];
        const contract = contracts[idx];
        const tenant = tenants[idx];

        await tenantPrisma.agreementReport.create({
          data: {
            id: generateDemoId(tenantSlug, 'agreement-report', String(idx + 1)),
            tenantId,
            companyId,
            type: agreementTypes[idx % agreementTypes.length]!,
            apartmentId: apt.id,
            contractId: contract.id,
            agreementStatus: agreementStatuses[idx % agreementStatuses.length]!,
            rentAmount: apt.rentPrice || randomDecimal(8000, 25000),
            deposit: apt.deposit || randomDecimal(16000, 50000),
            deliveryDate: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            contractDate: idx < 3 ? new Date() : null,
            specialTerms: 'Standart şartlar geçerlidir.',
            nextSteps: 'Sözleşme imzası ve depozito tahsilatı',
            recipients: JSON.stringify([
              { email: tenant.email, name: tenant.firstName ? `${tenant.firstName} ${tenant.lastName}` : tenant.companyName, type: 'to' },
            ]),
            attachments: [],
            status: idx < 3 ? 'sent' : 'draft',
            sentAt: idx < 3 ? new Date() : null,
          },
        });
        agreementReportsCreated++;
        itemsCreated++;
      }
      details['agreementReports'] = agreementReportsCreated;

      // ============================================
      // 15. MAINTENANCE RECORDS
      // ============================================
      const maintenanceTypes = ['preventive', 'corrective', 'emergency'];
      const maintenanceStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      let maintenanceRecordsCreated = 0;

      // Detailed maintenance records with realistic scenarios
      const maintenanceScenarios = [
        { category: 'Tesisat', items: ['Pis su borusu değişimi', 'Musluk tamiri', 'Sıcak su deposu bakımı', 'Tesisat kaçak tespiti'] },
        { category: 'Elektrik', items: ['Sigorta kutusu yenileme', 'Priz arıza tamiri', 'Aydınlatma bakımı', 'Kablo değişimi'] },
        { category: 'Boya', items: ['İç cephe boyama', 'Dış cephe boyama', 'Kapı boyama', 'Tavan boyama'] },
        { category: 'Tadilat', items: ['Mutfak dolabı yenileme', 'Banyo tadilatı', 'Zemin döşeme', 'Balkon tadilatı'] },
        { category: 'Isıtma', items: ['Kombi bakımı', 'Radyatör temizliği', 'Kalorifer tesisatı kontrolü', 'Termostat değişimi'] },
        { category: 'Klima', items: ['Klima bakımı', 'Filtre değişimi', 'Gaz dolumu', 'Klima montajı'] },
      ];

      // Create maintenance records for each apartment with varied scenarios
      for (const apt of apartments) {
        // Each apartment gets 2-3 maintenance records
        const numRecords = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < numRecords; i++) {
          const scenario = randomChoice(maintenanceScenarios);
          const item = randomChoice(scenario.items);
          const status = randomChoice(maintenanceStatuses);
          const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days from now
          const scheduledDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);

          await tenantPrisma.realEstateMaintenanceRecord.create({
            data: {
              tenantId,
              companyId,
              apartmentId: apt.id,
              type: randomChoice(maintenanceTypes),
              title: `${apt.unitNumber} - ${item}`,
              description: `${apt.unitNumber} no'lu daire için ${scenario.category.toLowerCase()} bakımı: ${item}. ${
                status === 'completed' ? 'İşlem başarıyla tamamlandı.' :
                status === 'in_progress' ? 'İşlem devam ediyor.' :
                status === 'cancelled' ? 'İşlem iptal edildi.' :
                'İşlem planlandı.'
              }`,
              status,
              scheduledDate,
              startDate: status !== 'scheduled' && status !== 'cancelled' ? new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000) : null,
              endDate: status === 'completed' ? new Date(scheduledDate.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
              estimatedCost: randomDecimal(500, 8000),
              actualCost: status === 'completed' ? randomDecimal(400, 7500) : null,
              documents: [],
              photos: [],
            },
          });
          maintenanceRecordsCreated++;
          itemsCreated++;
        }
      }
      details['maintenanceRecords'] = maintenanceRecordsCreated;

      // ============================================
      // 16. BULK OPERATIONS
      // ============================================
      const bulkOperationsData = [
        { type: 'rent_increase', title: 'Yıllık Kira Artışı 2024', status: 'completed', description: 'Yıllık %25 kira artışı uygulaması' },
        { type: 'payment_generate', title: 'Ocak 2025 Ödeme Oluşturma', status: 'completed', description: 'Toplu ödeme oluşturma işlemi' },
        { type: 'contract_renewal', title: 'Sözleşme Yenileme Bildirimi', status: 'pending', description: 'Süresi dolacak sözleşmeler için bildirim' },
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
            affectedCount: contracts.length,
            successCount: bo.status === 'completed' ? contracts.length - 1 : 0,
            failedCount: bo.status === 'completed' ? 1 : 0,
            parameters: { increaseRate: 0.25, sendEmail: true, year: 2024 },
            results: bo.status === 'completed' ? { message: 'İşlem başarıyla tamamlandı', processedContracts: contracts.length } : undefined,
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
    const { tenantPrisma, tenantSlug } = ctx;
    let itemsDeleted = 0;

    try {
      // Delete in reverse order of dependencies
      // Support both old format (property-1) and new format (tenantSlug-demo-property-1)
      const propertyIdPatterns = [
        { id: { contains: '-demo-property-' } },
        { id: { startsWith: `${tenantSlug}-demo-property-` } },
        { id: { in: ['property-1', 'property-2', 'property-3'] } }, // Old format fallback
      ];

      // Find all demo properties first
      const demoProperties = await tenantPrisma.property.findMany({
        where: { OR: propertyIdPatterns },
        select: { id: true },
      });
      const propertyIds = demoProperties.map(p => p.id);

      if (propertyIds.length === 0) {
        // No demo properties found
        return { success: true, itemsCreated: 0, itemsDeleted: 0 };
      }

      // Bulk Operations
      const bulkOpResult = await tenantPrisma.bulkOperation.deleteMany({
        where: { id: { contains: '-demo-bulk-operation-' } },
      });
      itemsDeleted += bulkOpResult.count;

      // Real Estate Maintenance Records - delete via apartment -> property relation
      const reMaintenanceResult = await tenantPrisma.realEstateMaintenanceRecord.deleteMany({
        where: { apartment: { propertyId: { in: propertyIds } } },
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

      // Side Cost Reconciliations
      const reconciliationResult = await tenantPrisma.sideCostReconciliation.deleteMany({
        where: { propertyId: { in: propertyIds } },
      });
      itemsDeleted += reconciliationResult.count;

      // Property Expenses
      const expenseResult = await tenantPrisma.propertyExpense.deleteMany({
        where: { propertyId: { in: propertyIds } },
      });
      itemsDeleted += expenseResult.count;

      // Appointments - delete via apartment -> property relation
      const appointmentResult = await tenantPrisma.appointment.deleteMany({
        where: { apartment: { propertyId: { in: propertyIds } } },
      });
      itemsDeleted += appointmentResult.count;

      // Payments - delete via contract -> apartment -> property relation
      const paymentResult = await tenantPrisma.payment.deleteMany({
        where: { contract: { apartment: { propertyId: { in: propertyIds } } } },
      });
      itemsDeleted += paymentResult.count;

      // Contracts - delete via apartment -> property relation
      const contractResult = await tenantPrisma.contract.deleteMany({
        where: { apartment: { propertyId: { in: propertyIds } } },
      });
      itemsDeleted += contractResult.count;

      // RE Staff - PropertyStaff records
      const propertyStaffResult = await tenantPrisma.propertyStaff.deleteMany({
        where: { propertyId: { in: propertyIds } },
      });
      itemsDeleted += propertyStaffResult.count;

      // RE Staff
      const staffResult = await tenantPrisma.realEstateStaff.deleteMany({
        where: { id: { contains: '-demo-re-staff-' } },
      });
      itemsDeleted += staffResult.count;

      // RE Tenants
      const tenantResult = await tenantPrisma.tenant.deleteMany({
        where: { id: { contains: '-demo-re-tenant-' } },
      });
      itemsDeleted += tenantResult.count;

      // Apartments - delete via property relation
      const apartmentResult = await tenantPrisma.apartment.deleteMany({
        where: { propertyId: { in: propertyIds } },
      });
      itemsDeleted += apartmentResult.count;

      // Properties
      const propertyResult = await tenantPrisma.property.deleteMany({
        where: { id: { in: propertyIds } },
      });
      itemsDeleted += propertyResult.count;

      return { success: true, itemsCreated: 0, itemsDeleted };
    } catch (error: any) {
      console.error('Real Estate unseed error:', error);
      return { success: false, itemsCreated: 0, itemsDeleted, error: error.message };
    }
  }

  async checkStatus(ctx: SeederContext): Promise<{ hasData: boolean; count: number }> {
    const { tenantPrisma } = ctx;

    const propertyCount = await tenantPrisma.property.count({
      where: { id: { contains: '-demo-property-' } },
    });

    const apartmentCount = await tenantPrisma.apartment.count({
      where: { unitNumber: { in: ['1', '2', '3', '4', '5', '6'] } },
    });

    const contractCount = await tenantPrisma.contract.count({
      where: { contractNumber: { startsWith: 'CONT-' } },
    });

    const count = propertyCount + apartmentCount + contractCount;
    return { hasData: count > 0, count };
  }
}
