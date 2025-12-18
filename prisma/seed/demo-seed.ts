/**
 * Demo Seed Script
 * 
 * Tüm modüller için kapsamlı demo verileri oluşturur
 * Usage: TENANT_DATABASE_URL="..." tsx prisma/seed/demo-seed.ts --tenant-slug=omnexcore
 * 
 * Bu script opsiyoneldir ve sadece demo/test amaçlı kullanılmalıdır.
 */

import { PrismaClient as TenantPrismaClient, Prisma } from '@prisma/tenant-client';
import { PrismaClient as CorePrismaClient } from '@prisma/core-client';

const tenantPrisma = new TenantPrismaClient();
const corePrisma = new CorePrismaClient();
const tenantSlug = process.argv.find(arg => arg.startsWith('--tenant-slug='))?.split('=')[1] || 'omnexcore';

// Helper functions
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomDecimal(min: number, max: number): Prisma.Decimal {
  return new Prisma.Decimal((Math.random() * (max - min) + min).toFixed(2));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Stats tracking
const stats: Record<string, number> = {};
let errors: string[] = [];

function logSuccess(key: string, count: number) {
  stats[key] = count;
  console.log(`✅ ${count} ${key} created`);
}

function logError(module: string, error: any) {
  const msg = `${module}: ${error.code || error.message || 'Unknown error'}`;
  errors.push(msg);
  console.log(`⚠️ ${module} skipped (${error.code || 'error'})`);
}

async function main() {
  console.log(`\n🎭 Starting DEMO seed for tenant: ${tenantSlug}`);
  console.log('=' .repeat(60));

  try {
    // ⚠️ IMPORTANT: Get the REAL tenant ID from core database
    // API routes use this ID, not the slug string
    const coreTenant = await corePrisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true }
    });

    if (!coreTenant) {
      console.error(`❌ Tenant "${tenantSlug}" not found in core database!`);
      console.error('   Make sure the tenant exists in the core database.');
      process.exit(1);
    }

    // Use the REAL tenant ID from core database (e.g., 'cmihdab360001154g12z46vvn')
    const realTenantId = coreTenant.id;
    console.log(`📍 Real tenant ID from core DB: ${realTenantId}`);

    // Get or create company
    let company = await tenantPrisma.company.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (!company) {
      company = await tenantPrisma.company.create({
        data: {
          name: `${tenantSlug} Demo Company`,
          industry: 'Technology',
          status: 'Active'
        }
      });
    }

    // Get admin user for relations
    const adminUser = await tenantPrisma.user.findFirst({
      where: { role: { in: ['SuperAdmin', 'AgencyUser'] } },
      orderBy: { createdAt: 'asc' }
    });

    if (!adminUser) {
      console.error('❌ No admin user found. Run tenant-seed.ts first.');
      process.exit(1);
    }

    // Use the REAL tenant ID from core database, not a fabricated string!
    const tenantId = realTenantId;
    const companyId = company.id;

    // ============================================
    // 1. LOCATIONS MODULE
    // ============================================
    console.log('\n📍 Creating Locations...');
    let locations: any[] = [];
    
    try {
      locations = await Promise.all([
        tenantPrisma.location.upsert({
          where: { id: `${tenantSlug}-location-hq` },
          update: {},
          create: {
            id: `${tenantSlug}-location-hq`,
            tenantId,
            companyId,
            name: 'Merkez Ofis',
            type: 'firma',
            code: 'HQ-001',
            description: 'Ana merkez binası',
            address: 'Atatürk Caddesi No: 123',
            city: 'İstanbul',
            country: 'Türkiye',
            postalCode: '34000',
            isActive: true
          }
        }),
        tenantPrisma.location.upsert({
          where: { id: `${tenantSlug}-location-factory` },
          update: {},
          create: {
            id: `${tenantSlug}-location-factory`,
            tenantId,
            companyId,
            name: 'Üretim Tesisi',
            type: 'isletme',
            code: 'FAC-001',
            description: 'Ana üretim tesisi',
            address: 'Organize Sanayi Bölgesi 5. Cadde No: 45',
            city: 'Kocaeli',
            country: 'Türkiye',
            postalCode: '41000',
            isActive: true
          }
        }),
        tenantPrisma.location.upsert({
          where: { id: `${tenantSlug}-location-warehouse` },
          update: {},
          create: {
            id: `${tenantSlug}-location-warehouse`,
            tenantId,
            companyId,
            name: 'Depo',
            type: 'lokasyon',
            code: 'WH-001',
            description: 'Malzeme deposu',
            address: 'Lojistik Merkezi A Blok',
            city: 'İstanbul',
            country: 'Türkiye',
            postalCode: '34500',
            isActive: true
          }
        })
      ]);
      logSuccess('locations', locations.length);
    } catch (error: any) {
      logError('Locations', error);
    }

    // ============================================
    // 2. EQUIPMENT (for Maintenance)
    // ============================================
    console.log('\n🔧 Creating Equipment...');
    let equipment: any[] = [];
    
    try {
      const equipmentData = [
        { name: 'CNC Torna Makinesi', category: 'makine', type: 'cnc', brand: 'Mazak', model: 'QT-200' },
        { name: 'Kaynak Robotu', category: 'makine', type: 'robot', brand: 'Fanuc', model: 'ARC Mate 100iD' },
        { name: 'Pres Makinesi', category: 'makine', type: 'pres', brand: 'Ermaksan', model: 'Speed-Bend Pro' },
        { name: 'Kompresör', category: 'elektronik', type: 'compressor', brand: 'Atlas Copco', model: 'GA30' },
        { name: 'Forklift', category: 'arac', type: 'forklift', brand: 'Toyota', model: '8FG25' },
        { name: 'Lazer Kesim Makinesi', category: 'makine', type: 'laser', brand: 'Trumpf', model: 'TruLaser 3030' },
        { name: 'Boya Kabini', category: 'makine', type: 'paint', brand: 'Gema', model: 'OptiCenter OC06' },
        { name: 'Vinç', category: 'makine', type: 'crane', brand: 'Kone', model: 'CXT 5t' }
      ];

      equipment = await Promise.all(
        equipmentData.map((eq, idx) =>
          tenantPrisma.equipment.upsert({
            where: { id: `${tenantSlug}-equipment-${idx + 1}` },
            update: {},
            create: {
              id: `${tenantSlug}-equipment-${idx + 1}`,
              tenantId,
              companyId,
              locationId: locations.length > 0 ? randomChoice(locations).id : null,
              name: eq.name,
              code: `EQ-${String(idx + 1).padStart(3, '0')}`,
              category: eq.category,
              type: eq.type,
              brand: eq.brand,
              model: eq.model,
              serialNumber: `SN-${Date.now()}-${idx}`,
              status: randomChoice(['active', 'active', 'active', 'maintenance']),
              purchaseDate: randomDate(new Date(2020, 0, 1), new Date(2023, 11, 31)),
              warrantyUntil: randomDate(new Date(2024, 0, 1), new Date(2026, 11, 31)),
              isActive: true
            }
          })
        )
      );
      logSuccess('equipment', equipment.length);
    } catch (error: any) {
      logError('Equipment', error);
    }

    // ============================================
    // 3. MAINTENANCE RECORDS
    // ============================================
    console.log('\n🛠️ Creating Maintenance Records...');
    
    try {
      if (equipment.length > 0 && locations.length > 0) {
        const maintenanceTypes = ['preventive', 'corrective', 'emergency'];
        const maintenanceStatuses = ['scheduled', 'in_progress', 'completed'];
        
        const maintenanceRecords = await Promise.all(
          equipment.slice(0, 5).map((eq, idx) =>
            tenantPrisma.maintenanceRecord.upsert({
              where: { id: `${tenantSlug}-maintenance-${idx + 1}` },
              update: {},
              create: {
                id: `${tenantSlug}-maintenance-${idx + 1}`,
                tenantId,
                companyId,
                locationId: eq.locationId || locations[0].id,
                equipmentId: eq.id,
                type: randomChoice(maintenanceTypes),
                title: `${eq.name} - Periyodik Bakım`,
                description: `${eq.name} için planlanmış periyodik bakım çalışması`,
                status: randomChoice(maintenanceStatuses),
                scheduledDate: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                startDate: idx < 3 ? new Date() : null,
                estimatedCost: randomDecimal(500, 5000),
                actualCost: idx < 2 ? randomDecimal(400, 4500) : null,
                assignedTo: adminUser.id,
                notes: 'Demo bakım kaydı',
                isActive: true
              }
            })
          )
        );
        logSuccess('maintenance records', maintenanceRecords.length);
      } else {
        console.log('⚠️ Maintenance records skipped (no equipment/locations)');
      }
    } catch (error: any) {
      logError('Maintenance Records', error);
    }

    // ============================================
    // 4. REAL ESTATE MODULE
    // ============================================
    console.log('\n🏠 Creating Real Estate Properties...');
    let properties: any[] = [];
    
    try {
      properties = await Promise.all([
        tenantPrisma.property.upsert({
          where: { id: `${tenantSlug}-property-1` },
          update: {},
          create: {
            id: `${tenantSlug}-property-1`,
            tenantId,
            companyId,
            name: 'Deniz Apartmanı',
            type: 'apartment',
            code: 'PROP-001',
            address: 'Sahil Caddesi No: 45',
            city: 'İstanbul',
            district: 'Kadıköy',
            neighborhood: 'Fenerbahçe',
            country: 'TR',
            totalUnits: 12,
            monthlyFee: new Prisma.Decimal(2500),
            paymentDay: 5,
            description: 'Deniz manzaralı lüks apartman',
            isActive: true
          }
        }),
        tenantPrisma.property.upsert({
          where: { id: `${tenantSlug}-property-2` },
          update: {},
          create: {
            id: `${tenantSlug}-property-2`,
            tenantId,
            companyId,
            name: 'Park Residence',
            type: 'complex',
            code: 'PROP-002',
            address: 'Park Sokak No: 12',
            city: 'İstanbul',
            district: 'Beşiktaş',
            neighborhood: 'Etiler',
            country: 'TR',
            totalUnits: 24,
            monthlyFee: new Prisma.Decimal(3500),
            paymentDay: 10,
            description: 'Parkın yanında prestijli konut',
            isActive: true
          }
        }),
        tenantPrisma.property.upsert({
          where: { id: `${tenantSlug}-property-3` },
          update: {},
          create: {
            id: `${tenantSlug}-property-3`,
            tenantId,
            companyId,
            name: 'Yeşil Vadi Sitesi',
            type: 'complex',
            code: 'PROP-003',
            address: 'Vadi Yolu No: 78',
            city: 'İstanbul',
            district: 'Sarıyer',
            neighborhood: 'Maslak',
            country: 'TR',
            totalUnits: 48,
            monthlyFee: new Prisma.Decimal(4000),
            paymentDay: 15,
            description: 'Doğayla iç içe yaşam alanı',
            isActive: true
          }
        })
      ]);
      logSuccess('properties', properties.length);
    } catch (error: any) {
      logError('Properties', error);
    }

    // Create Apartments
    console.log('🚪 Creating Apartments...');
    let apartments: any[] = [];
    
    try {
      if (properties.length > 0) {
        for (const property of properties) {
          const unitCount = property.type === 'apartment' ? 4 : 6;
          for (let i = 1; i <= unitCount; i++) {
            const apartment = await tenantPrisma.apartment.upsert({
              where: { 
                propertyId_unitNumber: {
                  propertyId: property.id,
                  unitNumber: `${i}`
                }
              },
              update: {},
              create: {
                tenantId,
                companyId,
                propertyId: property.id,
                unitNumber: `${i}`,
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
                isActive: true
              }
            });
            apartments.push(apartment);
          }
        }
        logSuccess('apartments', apartments.length);
      }
    } catch (error: any) {
      logError('Apartments', error);
    }

    // Create Tenants (Kiracılar)
    console.log('👥 Creating Real Estate Tenants...');
    let tenants: any[] = [];
    
    try {
      const tenantNames = [
        { name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@email.com', phone: '0532 111 2233' },
        { name: 'Ayşe Demir', email: 'ayse.demir@email.com', phone: '0533 222 3344' },
        { name: 'Mehmet Kaya', email: 'mehmet.kaya@email.com', phone: '0534 333 4455' },
        { name: 'Fatma Özkan', email: 'fatma.ozkan@email.com', phone: '0535 444 5566' },
        { name: 'Ali Çelik', email: 'ali.celik@email.com', phone: '0536 555 6677' },
        { name: 'Zeynep Arslan', email: 'zeynep.arslan@email.com', phone: '0537 666 7788' }
      ];

      tenants = await Promise.all(
        tenantNames.map((t, idx) =>
          tenantPrisma.tenant.upsert({
            where: { id: `${tenantSlug}-re-tenant-${idx + 1}` },
            update: {},
            create: {
              id: `${tenantSlug}-re-tenant-${idx + 1}`,
              tenantId,
              companyId,
              tenantNumber: `KRC-${String(idx + 1).padStart(4, '0')}`,
              moveInDate: randomDate(new Date(2022, 0, 1), new Date(2024, 6, 1)),
              paymentScore: randomDecimal(70, 100),
              contactScore: randomDecimal(80, 100),
              maintenanceScore: randomDecimal(75, 100),
              overallScore: randomDecimal(75, 100),
              notes: `Demo kiracı: ${t.name}`,
              isActive: true
            }
          })
        )
      );
      logSuccess('tenants (RE)', tenants.length);
    } catch (error: any) {
      logError('RE Tenants', error);
    }

    // Create Contracts
    console.log('📝 Creating Contracts...');
    let contracts: any[] = [];
    
    try {
      if (apartments.length > 0 && tenants.length > 0) {
        const rentedApartments = apartments.filter(a => a.status === 'rented');
        
        contracts = await Promise.all(
          rentedApartments.slice(0, 6).map((apt, idx) =>
            tenantPrisma.contract.upsert({
              where: { 
                tenantId_contractNumber: {
                  tenantId,
                  contractNumber: `CONT-${String(idx + 1).padStart(4, '0')}`
                }
              },
              update: {},
              create: {
                tenantId,
                companyId,
                apartmentId: apt.id,
                tenantRecordId: tenants[idx % tenants.length].id,
                contractNumber: `CONT-${String(idx + 1).padStart(4, '0')}`,
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
                isActive: true
              }
            })
          )
        );
        logSuccess('contracts', contracts.length);
      }
    } catch (error: any) {
      logError('Contracts', error);
    }

    // Create Payments (Real Estate)
    console.log('💰 Creating Real Estate Payments...');
    let rePayments: any[] = [];
    
    try {
      if (contracts.length > 0) {
        for (const contract of contracts) {
          for (let month = 0; month < 3; month++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() - month);
            dueDate.setDate(contract.paymentDay || 5);
            
            const payment = await tenantPrisma.payment.create({
              data: {
                tenantId, // Multi-tenant firma ID (core tenant)
                companyId,
                apartmentId: contract.apartmentId,
                contractId: contract.id,
                tenantRecordId: contract.tenantRecordId, // Kiracı kişi ID (RETenant)
                type: 'rent',
                amount: contract.rentAmount,
                currency: 'TRY',
                dueDate,
                paidDate: month > 0 ? dueDate : null,
                status: month > 0 ? 'paid' : randomChoice(['pending', 'paid']),
                totalAmount: contract.rentAmount,
                paymentMethod: month > 0 ? randomChoice(['bank_transfer', 'cash']) : null,
                isAutoGenerated: false
              }
            });
            rePayments.push(payment);
          }
        }
        logSuccess('RE payments', rePayments.length);
      }
    } catch (error: any) {
      logError('RE Payments', error);
    }

    // Create Appointments
    console.log('📅 Creating Appointments...');
    try {
      if (apartments.length > 0 && tenants.length > 0) {
        const appointmentTypes = ['viewing', 'delivery', 'maintenance', 'inspection'];
        
        const reAppointments = await Promise.all(
          apartments.slice(0, 8).map((apt, idx) =>
            tenantPrisma.appointment.create({
              data: {
                tenantId, // Multi-tenant firma ID (core tenant)
                companyId,
                apartmentId: apt.id,
                tenantRecordId: tenants[idx % tenants.length]?.id, // Kiracı kişi ID (RETenant) - opsiyonel
                type: randomChoice(appointmentTypes),
                title: `${apt.unitNumber} No'lu Daire - ${randomChoice(['Gösterim', 'Teslim', 'Bakım', 'Kontrol'])}`,
                description: 'Demo randevu kaydı',
                startDate: randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
                endDate: randomDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                duration: randomChoice([30, 60, 90]),
                status: randomChoice(['scheduled', 'scheduled', 'completed']),
                followUpRequired: Math.random() > 0.7
              }
            })
          )
        );
        logSuccess('appointments', reAppointments.length);
      }
    } catch (error: any) {
      logError('Appointments', error);
    }

    // Create Real Estate Staff
    console.log('👷 Creating Real Estate Staff...');
    try {
      if (properties.length > 0) {
        const staffRoles = ['manager', 'agent', 'accountant', 'maintenance'];
        const staffNames = ['Murat Şahin', 'Elif Yıldız', 'Burak Aydın', 'Selin Koç'];

        const reStaff = await Promise.all(
          staffNames.map((name, idx) =>
            tenantPrisma.realEstateStaff.upsert({
              where: { 
                tenantId_userId: {
                  tenantId,
                  userId: `staff-${idx + 1}`
                }
              },
              update: {},
              create: {
                tenantId,
                companyId,
                userId: `staff-${idx + 1}`,
                name,
                email: `${name.toLowerCase().replace(' ', '.')}@${tenantSlug}.com`,
                phone: `053${idx + 1} ${idx + 1}${idx + 1}${idx + 1} ${idx + 2}${idx + 2}${idx + 2}${idx + 2}`,
                staffType: 'internal',
                role: staffRoles[idx],
                propertyIds: properties.slice(0, idx + 1).map(p => p.id),
                assignedUnits: (idx + 1) * 5,
                collectionRate: randomDecimal(85, 98),
                averageVacancyDays: randomDecimal(5, 30),
                customerSatisfaction: randomDecimal(80, 100),
                isActive: true
              }
            })
          )
        );
        logSuccess('RE staff', reStaff.length);
      }
    } catch (error: any) {
      logError('RE Staff', error);
    }

    // ============================================
    // 5. ACCOUNTING MODULE
    // ============================================
    console.log('\n💼 Creating Accounting Data...');
    let subscriptions: any[] = [];
    
    try {
      subscriptions = await Promise.all([
        tenantPrisma.subscription.upsert({
          where: { id: `${tenantSlug}-subscription-1` },
          update: {},
          create: {
            id: `${tenantSlug}-subscription-1`,
            tenantId,
            companyId,
            name: 'Yazılım Lisansı - Enterprise',
            type: 'subscription',
            status: 'active',
            startDate: new Date(2024, 0, 1),
            renewalDate: new Date(2025, 0, 1),
            basePrice: new Prisma.Decimal(15000),
            currency: 'TRY',
            billingCycle: 'monthly',
            description: 'Enterprise yazılım paketi',
            isActive: true
          }
        }),
        tenantPrisma.subscription.upsert({
          where: { id: `${tenantSlug}-subscription-2` },
          update: {},
          create: {
            id: `${tenantSlug}-subscription-2`,
            tenantId,
            companyId,
            name: 'Cloud Hosting',
            type: 'subscription',
            status: 'active',
            startDate: new Date(2024, 0, 1),
            renewalDate: new Date(2025, 0, 1),
            basePrice: new Prisma.Decimal(5000),
            currency: 'TRY',
            billingCycle: 'monthly',
            description: 'Cloud sunucu hizmeti',
            isActive: true
          }
        }),
        tenantPrisma.subscription.upsert({
          where: { id: `${tenantSlug}-subscription-3` },
          update: {},
          create: {
            id: `${tenantSlug}-subscription-3`,
            tenantId,
            companyId,
            name: 'Ofis Kirası',
            type: 'rental',
            status: 'active',
            startDate: new Date(2023, 6, 1),
            renewalDate: new Date(2024, 6, 1),
            basePrice: new Prisma.Decimal(35000),
            currency: 'TRY',
            billingCycle: 'monthly',
            description: 'Merkez ofis kirası',
            isActive: true
          }
        })
      ]);
      logSuccess('subscriptions', subscriptions.length);
    } catch (error: any) {
      logError('Subscriptions', error);
    }

    // Create Invoices
    console.log('📄 Creating Invoices...');
    let invoices: any[] = [];
    
    try {
      for (let i = 0; i < 10; i++) {
        const invoiceDate = new Date();
        invoiceDate.setMonth(invoiceDate.getMonth() - i);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);
        
        const subtotal = randomDecimal(5000, 50000);
        const taxAmount = new Prisma.Decimal(Number(subtotal) * 0.20);
        const totalAmount = new Prisma.Decimal(Number(subtotal) + Number(taxAmount));

        const invoice = await tenantPrisma.invoice.upsert({
          where: { 
            tenantId_invoiceNumber: {
              tenantId,
              invoiceNumber: `INV-2024-${String(i + 1).padStart(4, '0')}`
            }
          },
          update: {},
          create: {
            tenantId,
            companyId,
            subscriptionId: subscriptions.length > 0 ? subscriptions[i % subscriptions.length].id : null,
            invoiceNumber: `INV-2024-${String(i + 1).padStart(4, '0')}`,
            invoiceDate,
            dueDate,
            subtotal,
            taxRate: new Prisma.Decimal(20),
            taxAmount,
            totalAmount,
            currency: 'TRY',
            status: i < 3 ? randomChoice(['draft', 'sent']) : randomChoice(['paid', 'paid', 'overdue']),
            paidDate: i >= 3 && Math.random() > 0.3 ? dueDate : null,
            description: subscriptions.length > 0 ? `Fatura - ${subscriptions[i % subscriptions.length].name}` : 'Demo fatura',
            items: JSON.stringify([
              { description: 'Hizmet bedeli', quantity: 1, unitPrice: Number(subtotal), total: Number(subtotal) }
            ]),
            isActive: true
          }
        });
        invoices.push(invoice);
      }
      logSuccess('invoices', invoices.length);
    } catch (error: any) {
      logError('Invoices', error);
    }

    // Create Accounting Payments
    console.log('💳 Creating Accounting Payments...');
    try {
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      
      const accountingPayments = await Promise.all(
        paidInvoices.map((inv, idx) =>
          tenantPrisma.accountingPayment.create({
            data: {
              tenantId,
              companyId,
              subscriptionId: inv.subscriptionId,
              invoiceId: inv.id,
              amount: inv.totalAmount,
              currency: 'TRY',
              paymentDate: inv.paidDate || new Date(),
              paymentMethod: randomChoice(['bank_transfer', 'card', 'cash']),
              paymentReference: `PAY-${Date.now()}-${idx}`,
              status: 'completed',
              notes: 'Demo ödeme'
            }
          })
        )
      );
      logSuccess('accounting payments', accountingPayments.length);
    } catch (error: any) {
      logError('Accounting Payments', error);
    }

    // Create Expenses
    console.log('📊 Creating Expenses...');
    try {
      const expenseCategories = ['Operasyonel', 'Personel', 'Pazarlama', 'IT', 'Genel'];
      const expenseTypes = ['operational', 'rent', 'utility', 'maintenance', 'other'];
      
      const expenses = await Promise.all(
        Array.from({ length: 15 }, (_, idx) => 
          tenantPrisma.expense.create({
            data: {
              tenantId,
              companyId,
              locationId: locations.length > 0 ? locations[idx % locations.length].id : null,
              name: `Gider Kalemi ${idx + 1}`,
              category: randomChoice(expenseCategories),
              type: randomChoice(expenseTypes),
              amount: randomDecimal(500, 15000),
              currency: 'TRY',
              expenseDate: randomDate(new Date(2024, 0, 1), new Date()),
              assignedUserId: adminUser.id,
              status: randomChoice(['pending', 'approved', 'approved']),
              approvedBy: idx % 3 === 0 ? null : adminUser.id,
              approvedAt: idx % 3 === 0 ? null : new Date(),
              description: 'Demo gider kaydı',
              isActive: true
            }
          })
        )
      );
      logSuccess('expenses', expenses.length);
    } catch (error: any) {
      logError('Expenses', error);
    }

    // ============================================
    // 6. HR MODULE
    // ============================================
    console.log('\n👥 Creating HR Data...');
    let employeeUsers: any[] = [];
    
    try {
      const employeeNames = [
        'Emre Yılmaz', 'Deniz Kaya', 'Canan Arslan', 'Oğuz Demir',
        'Sibel Çelik', 'Kerem Öztürk', 'Pınar Şahin', 'Baran Aydın'
      ];
      const departments = ['Yazılım', 'Satış', 'Finans', 'İK', 'Operasyon', 'Pazarlama'];
      
      employeeUsers = await Promise.all(
        employeeNames.map(async (name, idx) => {
          const emailName = name.toLowerCase()
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
            .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
            .replace(' ', '.');
          
          return tenantPrisma.user.upsert({
            where: { email: `${emailName}@${tenantSlug}.com` },
            update: {},
            create: {
              name,
              email: `${emailName}@${tenantSlug}.com`,
              username: emailName,
              password: '$2a$10$dummy.hash.for.demo.purposes',
              role: 'ClientUser',
              status: 'active',
              department: randomChoice(departments),
              position: randomChoice(['Uzman', 'Kıdemli Uzman', 'Yönetici', 'Koordinatör']),
              phone: `053${idx} ${idx}${idx}${idx} ${idx + 1}${idx + 1}${idx + 1}${idx + 1}`
            }
          });
        })
      );
      logSuccess('employee users', employeeUsers.length);
    } catch (error: any) {
      logError('Employee Users', error);
    }

    // Create Employees
    let employees: any[] = [];
    try {
      if (employeeUsers.length > 0) {
        employees = await Promise.all(
          employeeUsers.map((user, idx) =>
            tenantPrisma.employee.upsert({
              where: { userId: user.id },
              update: {},
              create: {
                userId: user.id,
                tenantId,
                companyId,
                employeeNumber: `EMP-${String(idx + 1).padStart(4, '0')}`,
                department: user.department || 'Genel',
                position: user.position || 'Uzman',
                hireDate: randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1)),
                managerId: idx > 0 ? employeeUsers[0].id : null,
                salary: randomDecimal(25000, 80000),
                salaryGroup: randomChoice(['A', 'B', 'C']),
                currency: 'TRY',
                workType: randomChoice(['full_time', 'full_time', 'part_time', 'contract']),
                isActive: true
              }
            })
          )
        );
        logSuccess('employees', employees.length);
      }
    } catch (error: any) {
      logError('Employees', error);
    }

    // Create Leaves
    console.log('🏖️ Creating Leave Requests...');
    try {
      if (employees.length > 0) {
        const leaveTypes = ['annual', 'sick', 'unpaid', 'maternity'];
        const leaves: any[] = [];
        
        for (const emp of employees.slice(0, 6)) {
          for (let leaveIdx = 0; leaveIdx < 2; leaveIdx++) {
            const startDate = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
            const days = randomChoice([1, 2, 3, 5, 7, 14]);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + days);
            
            const leave = await tenantPrisma.leave.create({
              data: {
                tenantId,
                companyId,
                employeeId: emp.id,
                type: randomChoice(leaveTypes),
                startDate,
                endDate,
                days,
                status: randomChoice(['pending', 'approved', 'approved', 'rejected']),
                approvedBy: leaveIdx % 2 === 0 ? adminUser.id : null,
                approvedAt: leaveIdx % 2 === 0 ? new Date() : null,
                reason: 'Demo izin talebi'
              }
            });
            leaves.push(leave);
          }
        }
        logSuccess('leaves', leaves.length);
      }
    } catch (error: any) {
      logError('Leaves', error);
    }

    // Create Payrolls
    console.log('💵 Creating Payrolls...');
    try {
      if (employees.length > 0) {
        const payrolls: any[] = [];
        
        for (const emp of employees) {
          for (let monthIdx = 0; monthIdx < 3; monthIdx++) {
            const payDate = new Date();
            payDate.setMonth(payDate.getMonth() - monthIdx);
            payDate.setDate(25);
            
            const grossSalary = emp.salary || new Prisma.Decimal(30000);
            const taxDeduction = new Prisma.Decimal(Number(grossSalary) * 0.15);
            const sgkDeduction = new Prisma.Decimal(Number(grossSalary) * 0.14);
            const deductions = new Prisma.Decimal(Number(taxDeduction) + Number(sgkDeduction));
            const netSalary = new Prisma.Decimal(Number(grossSalary) - Number(deductions));
            
            const period = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`;
            
            const payroll = await tenantPrisma.payroll.create({
              data: {
                tenantId,
                companyId,
                employeeId: emp.id,
                period,
                payDate,
                grossSalary,
                deductions,
                netSalary,
                taxDeduction,
                sgkDeduction,
                bonuses: monthIdx === 0 ? randomDecimal(0, 5000) : new Prisma.Decimal(0),
                overtime: randomDecimal(0, 2000),
                status: monthIdx > 0 ? 'paid' : randomChoice(['draft', 'approved', 'paid']),
                notes: 'Demo bordro'
              }
            });
            payrolls.push(payroll);
          }
        }
        logSuccess('payrolls', payrolls.length);
      }
    } catch (error: any) {
      logError('Payrolls', error);
    }

    // ============================================
    // 7. PRODUCTION MODULE
    // ============================================
    console.log('\n🏭 Creating Production Data...');
    let products: any[] = [];
    
    try {
      const productData = [
        { name: 'Alüminyum Profil', code: 'PRD-001', category: 'Hammadde', type: 'hammadde' },
        { name: 'Çelik Levha', code: 'PRD-002', category: 'Hammadde', type: 'hammadde' },
        { name: 'Plastik Granül', code: 'PRD-003', category: 'Hammadde', type: 'hammadde' },
        { name: 'Vida Seti M8', code: 'PRD-004', category: 'Malzeme', type: 'hammadde' },
        { name: 'Motor Gövdesi', code: 'PRD-005', category: 'Yarı Mamul', type: 'yarı_mamul' },
        { name: 'Şanzıman Kutusu', code: 'PRD-006', category: 'Yarı Mamul', type: 'yarı_mamul' },
        { name: 'Elektrik Motoru 5kW', code: 'PRD-007', category: 'Mamul', type: 'mamul' },
        { name: 'Hidrolik Pompa', code: 'PRD-008', category: 'Mamul', type: 'mamul' },
        { name: 'Konveyör Sistemi', code: 'PRD-009', category: 'Mamul', type: 'mamul' },
        { name: 'Otomasyon Paneli', code: 'PRD-010', category: 'Mamul', type: 'mamul' }
      ];

      products = await Promise.all(
        productData.map((p, idx) =>
          tenantPrisma.product.upsert({
            where: { 
              tenantId_code: {
                tenantId,
                code: p.code
              }
            },
            update: {},
            create: {
              tenantId,
              companyId,
              locationId: locations.length > 0 ? locations[idx % locations.length].id : null,
              name: p.name,
              code: p.code,
              sku: `SKU-${p.code}`,
              barcode: `${Date.now()}${idx}`,
              category: p.category,
              type: p.type,
              stockQuantity: randomDecimal(10, 500),
              minStockLevel: randomDecimal(5, 20),
              maxStockLevel: randomDecimal(500, 1000),
              unit: randomChoice(['adet', 'kg', 'metre', 'lt']),
              costPrice: randomDecimal(100, 5000),
              sellingPrice: randomDecimal(150, 7500),
              currency: 'TRY',
              isProducible: p.type !== 'hammadde',
              productionTime: p.type !== 'hammadde' ? randomChoice([30, 60, 120, 240]) : null,
              description: `${p.name} - Demo ürün`,
              isActive: true
            }
          })
        )
      );
      logSuccess('products', products.length);
    } catch (error: any) {
      logError('Products', error);
    }

    // Create Production Orders
    console.log('📋 Creating Production Orders...');
    let productionOrders: any[] = [];
    
    try {
      if (products.length > 0 && locations.length > 0) {
        const productionStatuses = ['pending', 'in_progress', 'completed'];
        const producibleProducts = products.filter(p => p.isProducible);
        
        productionOrders = await Promise.all(
          producibleProducts.slice(0, 6).map((product, idx) => {
            const plannedStart = randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
            const plannedEnd = new Date(plannedStart);
            plannedEnd.setDate(plannedEnd.getDate() + randomChoice([3, 5, 7, 14]));
            
            return tenantPrisma.productionOrder.upsert({
              where: { 
                tenantId_orderNumber: {
                  tenantId,
                  orderNumber: `PO-2024-${String(idx + 1).padStart(4, '0')}`
                }
              },
              update: {},
              create: {
                tenantId,
                companyId,
                locationId: product.locationId || locations[0].id,
                orderNumber: `PO-2024-${String(idx + 1).padStart(4, '0')}`,
                productId: product.id,
                quantity: randomDecimal(10, 100),
                unit: product.unit,
                status: randomChoice(productionStatuses),
                plannedStartDate: plannedStart,
                plannedEndDate: plannedEnd,
                actualStartDate: idx < 3 ? plannedStart : null,
                estimatedCost: randomDecimal(5000, 50000),
                actualCost: idx < 2 ? randomDecimal(4500, 48000) : null,
                priority: randomChoice(['low', 'normal', 'high', 'urgent']),
                notes: 'Demo üretim emri',
                isActive: true
              }
            });
          })
        );
        logSuccess('production orders', productionOrders.length);
      }
    } catch (error: any) {
      logError('Production Orders', error);
    }

    // Create Production Steps
    console.log('⚙️ Creating Production Steps...');
    try {
      if (productionOrders.length > 0) {
        const stepNames = ['Malzeme Hazırlık', 'Kesim', 'İşleme', 'Montaj', 'Kalite Kontrol', 'Paketleme'];
        const productionSteps: any[] = [];
        
        for (const order of productionOrders.slice(0, 4)) {
          for (let i = 0; i < 4; i++) {
            const step = await tenantPrisma.productionStep.create({
              data: {
                tenantId,
                companyId: order.companyId,
                orderId: order.id,
                stepNumber: i + 1,
                name: stepNames[i],
                description: `${stepNames[i]} adımı`,
                status: i < 2 ? 'completed' : randomChoice(['pending', 'in_progress']),
                plannedStart: order.plannedStartDate,
                plannedEnd: order.plannedEndDate,
                actualStart: i < 2 ? order.actualStartDate : null,
                actualEnd: i < 1 ? new Date() : null,
                assignedTo: adminUser.id,
                laborHours: i < 2 ? randomDecimal(2, 8) : null,
                notes: 'Demo adım'
              }
            });
            productionSteps.push(step);
          }
        }
        logSuccess('production steps', productionSteps.length);
      }
    } catch (error: any) {
      logError('Production Steps', error);
    }

    // Create Stock Movements
    console.log('📦 Creating Stock Movements...');
    try {
      if (products.length > 0) {
        const movementTypes = ['in', 'out', 'adjustment'];
        const stockMovements: any[] = [];
        
        for (const product of products.slice(0, 8)) {
          for (let moveIdx = 0; moveIdx < 3; moveIdx++) {
            const movement = await tenantPrisma.stockMovement.create({
              data: {
                tenantId,
                companyId,
                locationId: product.locationId,
                productId: product.id,
                type: randomChoice(movementTypes),
                quantity: randomDecimal(5, 50),
                unit: product.unit,
                referenceType: randomChoice(['production', 'sale', 'purchase']),
                referenceId: `REF-${Date.now()}-${moveIdx}`,
                movementDate: randomDate(new Date(2024, 0, 1), new Date()),
                notes: 'Demo stok hareketi'
              }
            });
            stockMovements.push(movement);
          }
        }
        logSuccess('stock movements', stockMovements.length);
      }
    } catch (error: any) {
      logError('Stock Movements', error);
    }

    // ============================================
    // 8. NOTIFICATIONS
    // ============================================
    console.log('\n🔔 Creating Notifications...');
    try {
      const notificationTypes = ['info', 'warning', 'success', 'alert', 'task'];
      const notificationTitles = [
        'Sistem Güncellemesi',
        'Yeni Özellik Eklendi',
        'Bakım Bildirimi',
        'Görev Hatırlatması',
        'Ödeme Bildirimi',
        'Toplantı Daveti',
        'Rapor Hazır',
        'Onay Bekliyor'
      ];

      const notifications = await Promise.all(
        notificationTitles.map((title, idx) =>
          tenantPrisma.notification.create({
            data: {
              title,
              message: `${title} - Bu bir demo bildirimdir. Detaylı bilgi için tıklayın.`,
              type: randomChoice(notificationTypes),
              priority: randomChoice(['low', 'medium', 'high']),
              senderId: adminUser.id,
              recipientId: adminUser.id,
              isRead: idx > 4,
              readAt: idx > 4 ? new Date() : null,
              isGlobal: idx % 3 === 0,
              module: randomChoice(['real-estate', 'accounting', 'hr', 'production', 'maintenance']),
              actionUrl: idx % 2 === 0 ? '/dashboard' : null,
              actionText: idx % 2 === 0 ? 'Detayları Gör' : null
            }
          })
        )
      );
      logSuccess('notifications', notifications.length);
    } catch (error: any) {
      logError('Notifications', error);
    }

    // ============================================
    // 9. CHAT MODULE
    // ============================================
    console.log('\n💬 Creating Chat Data...');
    let chatRooms: any[] = [];
    
    try {
      const participants = [adminUser.id];
      if (employeeUsers.length > 0) {
        participants.push(...employeeUsers.slice(0, 5).map(u => u.id));
      }
      
      chatRooms = await Promise.all([
        tenantPrisma.chatRoom.upsert({
          where: { id: `${tenantSlug}-room-general` },
          update: {},
          create: {
            id: `${tenantSlug}-room-general`,
            tenantId,
            name: 'Genel Sohbet',
            type: 'channel',
            participants,
            description: 'Genel iletişim kanalı',
            isActive: true
          }
        }),
        tenantPrisma.chatRoom.upsert({
          where: { id: `${tenantSlug}-room-project` },
          update: {},
          create: {
            id: `${tenantSlug}-room-project`,
            tenantId,
            name: 'Proje Takımı',
            type: 'group',
            participants: participants.slice(0, 4),
            description: 'Proje ekibi iletişimi',
            isActive: true
          }
        }),
        tenantPrisma.chatRoom.upsert({
          where: { id: `${tenantSlug}-room-support` },
          update: {},
          create: {
            id: `${tenantSlug}-room-support`,
            tenantId,
            name: 'Destek Ekibi',
            type: 'group',
            participants: participants.slice(0, 3),
            description: 'Teknik destek kanalı',
            isActive: true
          }
        })
      ]);
      logSuccess('chat rooms', chatRooms.length);
    } catch (error: any) {
      logError('Chat Rooms', error);
    }

    // Create Chat Messages
    try {
      if (chatRooms.length > 0) {
        const messageContents = [
          'Merhaba ekip! 👋',
          'Bugünkü toplantıyı hatırlatırım.',
          'Rapor hazır, kontrol edebilir misiniz?',
          'Teşekkürler, harika iş çıkardınız! 🎉',
          'Projede güncelleme var, lütfen bakın.',
          'Müşteriden geri dönüş aldık.',
          'Deadline yaklaşıyor, hızlanmalıyız.',
          'Sistem bakımı tamamlandı ✅'
        ];

        const chatMessages: any[] = [];
        for (const room of chatRooms) {
          for (let i = 0; i < 5; i++) {
            const message = await tenantPrisma.chatMessage.create({
              data: {
                tenantId,
                roomId: room.id,
                senderId: room.participants[i % room.participants.length],
                content: randomChoice(messageContents),
                type: 'text',
                isRead: i < 3,
                readAt: i < 3 ? new Date() : null
              }
            });
            chatMessages.push(message);
          }
        }
        logSuccess('chat messages', chatMessages.length);
      }
    } catch (error: any) {
      logError('Chat Messages', error);
    }

    // ============================================
    // 10. WEB BUILDER MODULE
    // ============================================
    console.log('\n🌐 Creating Web Builder Data...');
    let theme: any = null;
    let website: any = null;
    
    try {
      theme = await tenantPrisma.theme.upsert({
        where: { id: `${tenantSlug}-theme-default` },
        update: {},
        create: {
          id: `${tenantSlug}-theme-default`,
          name: 'Modern Business',
          description: 'Modern ve profesyonel iş teması',
          config: JSON.stringify({
            colors: {
              primary: '#3B82F6',
              secondary: '#8B5CF6',
              accent: '#10B981',
              background: '#FFFFFF',
              text: '#1F2937'
            },
            typography: {
              headingFont: 'Inter',
              bodyFont: 'Inter',
              baseFontSize: 16
            },
            spacing: {
              containerMaxWidth: 1200,
              sectionPadding: 80
            }
          }),
          isSystem: false
        }
      });

      website = await tenantPrisma.website.upsert({
        where: { id: `${tenantSlug}-website-main` },
        update: {},
        create: {
          id: `${tenantSlug}-website-main`,
          companyId,
          name: `${tenantSlug} Kurumsal Web Sitesi`,
          domain: `${tenantSlug}.demo.com`,
          status: 'published',
          themeId: theme.id,
          settings: JSON.stringify({
            seo: {
              title: `${tenantSlug} - Kurumsal Web Sitesi`,
              description: 'Demo kurumsal web sitesi',
              keywords: ['kurumsal', 'demo', 'iş']
            }
          })
        }
      });
      console.log('✅ Website and theme created');
      stats['websites'] = 1;
      stats['themes'] = 1;
    } catch (error: any) {
      logError('Website/Theme', error);
    }

    // Create Pages
    try {
      if (website) {
        const pages = await Promise.all([
          tenantPrisma.page.upsert({
            where: { 
              websiteId_slug: {
                websiteId: website.id,
                slug: 'ana-sayfa'
              }
            },
            update: {},
            create: {
              websiteId: website.id,
              title: 'Ana Sayfa',
              slug: 'ana-sayfa',
              description: 'Web sitesinin ana sayfası',
              status: 'published',
              isHome: true,
              metaTitle: `${tenantSlug} - Ana Sayfa`,
              metaDescription: 'Demo web sitesinin ana sayfası',
              order: 0
            }
          }),
          tenantPrisma.page.upsert({
            where: { 
              websiteId_slug: {
                websiteId: website.id,
                slug: 'hakkimizda'
              }
            },
            update: {},
            create: {
              websiteId: website.id,
              title: 'Hakkımızda',
              slug: 'hakkimizda',
              description: 'Şirket hakkında bilgiler',
              status: 'published',
              isHome: false,
              metaTitle: 'Hakkımızda',
              metaDescription: 'Şirketimiz hakkında detaylı bilgi',
              order: 1
            }
          }),
          tenantPrisma.page.upsert({
            where: { 
              websiteId_slug: {
                websiteId: website.id,
                slug: 'hizmetler'
              }
            },
            update: {},
            create: {
              websiteId: website.id,
              title: 'Hizmetlerimiz',
              slug: 'hizmetler',
              description: 'Sunduğumuz hizmetler',
              status: 'published',
              isHome: false,
              metaTitle: 'Hizmetlerimiz',
              metaDescription: 'Sunduğumuz profesyonel hizmetler',
              order: 2
            }
          }),
          tenantPrisma.page.upsert({
            where: { 
              websiteId_slug: {
                websiteId: website.id,
                slug: 'iletisim'
              }
            },
            update: {},
            create: {
              websiteId: website.id,
              title: 'İletişim',
              slug: 'iletisim',
              description: 'İletişim bilgileri ve form',
              status: 'published',
              isHome: false,
              metaTitle: 'İletişim',
              metaDescription: 'Bizimle iletişime geçin',
              order: 3
            }
          })
        ]);
        logSuccess('pages', pages.length);

        // Create Page Sections
        for (const page of pages) {
          await tenantPrisma.pageSection.create({
            data: {
              pageId: page.id,
              type: 'hero',
              order: 0,
              settings: JSON.stringify({
                background: 'gradient',
                height: 'full'
              }),
              content: JSON.stringify({
                title: page.title,
                subtitle: page.description
              })
            }
          });
        }
        console.log('✅ Page sections created');
        stats['page sections'] = pages.length;
      }
    } catch (error: any) {
      logError('Pages', error);
    }

    // Create Form
    try {
      if (website) {
        const contactForm = await tenantPrisma.form.create({
          data: {
            websiteId: website.id,
            name: 'İletişim Formu',
            fields: JSON.stringify([
              { name: 'name', type: 'text', label: 'Adınız', required: true },
              { name: 'email', type: 'email', label: 'E-posta', required: true },
              { name: 'phone', type: 'tel', label: 'Telefon', required: false },
              { name: 'message', type: 'textarea', label: 'Mesajınız', required: true }
            ]),
            settings: JSON.stringify({
              successMessage: 'Mesajınız başarıyla gönderildi!',
              emailNotification: true
            })
          }
        });

        // Create Form Submissions
        for (let i = 0; i < 5; i++) {
          await tenantPrisma.formSubmission.create({
            data: {
              formId: contactForm.id,
              data: JSON.stringify({
                name: `Demo Kullanıcı ${i + 1}`,
                email: `demo${i + 1}@example.com`,
                phone: `053${i} 123 4567`,
                message: 'Bu bir demo form gönderisidir.'
              }),
              status: randomChoice(['new', 'read'])
            }
          });
        }
        console.log('✅ Form and submissions created');
        stats['forms'] = 1;
        stats['form submissions'] = 5;
      }
    } catch (error: any) {
      logError('Forms', error);
    }

    // ============================================
    // 11. AI MODULE
    // ============================================
    console.log('\n🤖 Creating AI History...');
    try {
      const aiGenerationTypes = ['text', 'code', 'image'];
      const aiPrompts = [
        'Blog yazısı için SEO uyumlu başlık öner',
        'Müşteri hizmetleri için otomatik yanıt oluştur',
        'React component kodu yaz',
        'Ürün tanıtım metni hazırla',
        'Sosyal medya paylaşımı için metin oluştur'
      ];

      const aiGenerations = await Promise.all(
        aiPrompts.map((prompt) =>
          tenantPrisma.aIGeneration.create({
            data: {
              userId: adminUser.id,
              companyId,
              generatorType: randomChoice(aiGenerationTypes),
              prompt,
              output: `Demo AI çıktısı: ${prompt} için üretilen içerik.`,
              settings: JSON.stringify({
                model: 'gpt-4',
                temperature: 0.7,
                maxTokens: 1000
              })
            }
          })
        )
      );
      logSuccess('AI generations', aiGenerations.length);
    } catch (error: any) {
      logError('AI Generations', error);
    }

    // ============================================
    // 12. FILE MANAGEMENT
    // ============================================
    console.log('\n📁 Creating File Records...');
    try {
      const fileTypes = ['invoice', 'contract', 'report', 'document'];
      const modules = ['accounting', 'hr', 'real-estate', 'production'];

      const coreFiles = await Promise.all(
        Array.from({ length: 10 }, (_, idx) =>
          tenantPrisma.coreFile.create({
            data: {
              tenantId,
              module: randomChoice(modules),
              entityType: randomChoice(fileTypes),
              entityId: `entity-${idx + 1}`,
              filename: `demo-file-${idx + 1}.pdf`,
              originalName: `Dosya ${idx + 1}.pdf`,
              path: `${randomChoice(modules)}/${randomChoice(fileTypes)}s/2024/`,
              fullPath: `tenants/${tenantId}/module-files/${randomChoice(modules)}/`,
              size: Math.floor(Math.random() * 1000000) + 10000,
              mimeType: 'application/pdf',
              extension: 'pdf',
              title: `Demo Dosya ${idx + 1}`,
              description: 'Demo dosya açıklaması',
              tags: ['demo', 'test'],
              category: randomChoice(['important', 'archive', 'active']),
              version: 1,
              isLatest: true,
              permissions: JSON.stringify({
                read: ['SuperAdmin', 'AgencyUser'],
                write: ['SuperAdmin'],
                delete: ['SuperAdmin'],
                share: ['SuperAdmin', 'AgencyUser'],
                isPublic: false
              }),
              createdBy: adminUser.id,
              updatedBy: adminUser.id
            }
          })
        )
      );
      logSuccess('files', coreFiles.length);
    } catch (error: any) {
      logError('Files', error);
    }

    // ============================================
    // 13. REPORTS
    // ============================================
    console.log('\n📊 Creating Reports...');
    try {
      const reportTypes = ['financial', 'sales', 'inventory', 'hr', 'performance'];
      
      const reports = await Promise.all(
        reportTypes.map((type) =>
          tenantPrisma.report.create({
            data: {
              userId: adminUser.id,
              name: `${type.charAt(0).toUpperCase() + type.slice(1)} Raporu - ${new Date().toLocaleDateString('tr-TR')}`,
              reportType: type,
              description: `Demo ${type} raporu`,
              dateRange: JSON.stringify({
                start: new Date(2024, 0, 1).toISOString(),
                end: new Date().toISOString()
              }),
              visualization: randomChoice(['table', 'bar', 'line', 'pie']),
              status: randomChoice(['completed', 'completed', 'generating'])
            }
          })
        )
      );
      logSuccess('reports', reports.length);
    } catch (error: any) {
      logError('Reports', error);
    }

    // ============================================
    // 14. AUDIT LOGS
    // ============================================
    console.log('\n📝 Creating Audit Logs...');
    try {
      const auditActions = ['create', 'update', 'delete', 'login', 'export'];
      const auditEntities = ['User', 'Property', 'Invoice', 'Employee', 'Product'];

      const auditLogs = await Promise.all(
        Array.from({ length: 20 }, (_, idx) =>
          tenantPrisma.auditLog.create({
            data: {
              userId: adminUser.id,
              action: randomChoice(auditActions),
              entity: randomChoice(auditEntities),
              entityId: `entity-${idx + 1}`,
              metadata: JSON.stringify({
                changes: { field: 'value' },
                browser: 'Chrome',
                os: 'Windows'
              }),
              ipAddress: '192.168.1.' + (idx + 1),
              userAgent: 'Mozilla/5.0 Demo Browser'
            }
          })
        )
      );
      logSuccess('audit logs', auditLogs.length);
    } catch (error: any) {
      logError('Audit Logs', error);
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 DEMO SEED COMPLETED!');
    console.log('=' .repeat(60));
    
    console.log('\n📊 Created Data Summary:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ✅ ${key}: ${value}`);
    });

    if (errors.length > 0) {
      console.log('\n⚠️ Skipped Modules (may need migration):');
      errors.forEach(err => console.log(`   - ${err}`));
    }
    
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Demo seed failed:', error);
    throw error;
  } finally {
    await tenantPrisma.$disconnect();
    await corePrisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
