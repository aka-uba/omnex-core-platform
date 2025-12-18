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

      // RE Tenants (Kiracılar)
      const tenantNames = [
        { firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet.yilmaz@demo.com', phone: '0532 111 2233', mobile: '0532 111 2233', city: 'İstanbul' },
        { firstName: 'Ayşe', lastName: 'Demir', email: 'ayse.demir@demo.com', phone: '0533 222 3344', mobile: '0533 222 3344', city: 'İstanbul' },
        { firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet.kaya@demo.com', phone: '0534 333 4455', mobile: '0534 333 4455', city: 'Ankara' },
        { firstName: 'Fatma', lastName: 'Özkan', email: 'fatma.ozkan@demo.com', phone: '0535 444 5566', mobile: '0535 444 5566', city: 'İzmir' },
        { firstName: 'Ali', lastName: 'Çelik', email: 'ali.celik@demo.com', phone: '0536 555 6677', mobile: '0536 555 6677', city: 'İstanbul' },
        { firstName: 'Zeynep', lastName: 'Arslan', email: 'zeynep.arslan@demo.com', phone: '0537 666 7788', mobile: '0537 666 7788', city: 'Bursa' },
      ];

      const tenants: any[] = [];
      for (let idx = 0; idx < tenantNames.length; idx++) {
        const t = tenantNames[idx]!;
        const created = await tenantPrisma.tenant.upsert({
          where: { id: generateDemoId(tenantSlug, 're-tenant', String(idx + 1)) },
          update: {
            firstName: t.firstName,
            lastName: t.lastName,
            email: t.email,
            phone: t.phone,
            mobile: t.mobile,
            city: t.city,
          },
          create: {
            id: generateDemoId(tenantSlug, 're-tenant', String(idx + 1)),
            tenantId,
            companyId,
            tenantNumber: `KRC-DEMO-${String(idx + 1).padStart(4, '0')}`,
            firstName: t.firstName,
            lastName: t.lastName,
            email: t.email,
            phone: t.phone,
            mobile: t.mobile,
            city: t.city,
            tenantType: 'person',
            moveInDate: randomDate(new Date(2022, 0, 1), new Date(2024, 6, 1)),
            paymentScore: randomDecimal(70, 100),
            contactScore: randomDecimal(80, 100),
            maintenanceScore: randomDecimal(75, 100),
            overallScore: randomDecimal(75, 100),
            notes: `Demo kiracı: ${t.firstName} ${t.lastName}`,
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
