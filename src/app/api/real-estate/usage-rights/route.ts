import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';

// Schema for creating/updating usage rights
const usageRightSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional().nullable(),
  nameTr: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  sortOrder: z.number().int().optional().default(0),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  descriptionTr: z.string().optional().nullable(),
  isDefaultActive: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

// GET /api/real-estate/usage-rights - List usage rights
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ usageRights: unknown[]; total: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;

      // Parse query parameters
      const category = searchParams.get('category') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Build where clause
      const where: Prisma.UsageRightWhereInput = {
        tenantId: tenantContext.id,
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.usageRight.count({ where });

      // Get all usage rights (no pagination for master list)
      const usageRights = await tenantPrisma.usageRight.findMany({
        where,
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      return successResponse({
        usageRights: usageRights.map(ur => ({
          ...ur,
          createdAt: ur.createdAt.toISOString(),
          updatedAt: ur.updatedAt.toISOString(),
        })),
        total,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/usage-rights - Create usage right
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ usageRight: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = usageRightSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from first company (optional for master data)
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      // Check if name is unique for this tenant
      const existingUsageRight = await tenantPrisma.usageRight.findFirst({
        where: {
          tenantId: tenantContext.id,
          name: validatedData.name,
        },
      });

      if (existingUsageRight) {
        return errorResponse('Validation error', 'Usage right with this name already exists', 409);
      }

      // Create usage right
      const newUsageRight = await tenantPrisma.usageRight.create({
        data: {
          tenantId: tenantContext.id,
          companyId: firstCompany?.id || null,
          name: validatedData.name,
          nameEn: validatedData.nameEn || null,
          nameTr: validatedData.nameTr || null,
          category: validatedData.category,
          sortOrder: validatedData.sortOrder || 0,
          icon: validatedData.icon || null,
          description: validatedData.description || null,
          descriptionEn: validatedData.descriptionEn || null,
          descriptionTr: validatedData.descriptionTr || null,
          isDefaultActive: validatedData.isDefaultActive || false,
          isActive: validatedData.isActive ?? true,
        },
      });

      return successResponse({
        usageRight: {
          ...newUsageRight,
          createdAt: newUsageRight.createdAt.toISOString(),
          updatedAt: newUsageRight.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/usage-rights/seed - Seed default usage rights
export async function PUT(request: NextRequest) {
  return withTenant<ApiResponse<{ created: number; skipped: number }>>(
    request,
    async (tenantPrisma) => {
      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from first company
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      // Default usage rights from customer's system
      const defaultUsageRights = [
        // Parking (1-5)
        { name: 'Stellplatz', nameEn: 'Parking Space', nameTr: 'Otopark Yeri', category: 'parking', sortOrder: 1 },
        { name: 'Tiefgaragenstellplatz', nameEn: 'Underground Parking', nameTr: 'Yeraltı Otoparkı', category: 'parking', sortOrder: 2 },
        { name: 'Carport', nameEn: 'Carport', nameTr: 'Çardak Garaj', category: 'parking', sortOrder: 3 },
        { name: 'Garage', nameEn: 'Garage', nameTr: 'Garaj', category: 'parking', sortOrder: 4 },
        { name: 'Besucherparkplätze', nameEn: 'Visitor Parking', nameTr: 'Ziyaretçi Otoparkı', category: 'parking', sortOrder: 5 },
        { name: 'E-Ladesäule', nameEn: 'EV Charging Station', nameTr: 'Elektrikli Araç Şarj İstasyonu', category: 'parking', sortOrder: 6 },
        { name: 'Fahrradraum / Fahrradstellplatz', nameEn: 'Bicycle Room / Bicycle Parking', nameTr: 'Bisiklet Odası / Bisiklet Parkı', category: 'parking', sortOrder: 7 },

        // Heating (8-14)
        { name: 'Zentralheizung', nameEn: 'Central Heating', nameTr: 'Merkezi Isıtma', category: 'heating', sortOrder: 8 },
        { name: 'Fußbodenheizung', nameEn: 'Underfloor Heating', nameTr: 'Yerden Isıtma', category: 'heating', sortOrder: 9 },
        { name: 'Fernwärme', nameEn: 'District Heating', nameTr: 'Uzaktan Isıtma', category: 'heating', sortOrder: 10 },
        { name: 'Kamin / Ofen', nameEn: 'Fireplace / Stove', nameTr: 'Şömine / Soba', category: 'heating', sortOrder: 11 },
        { name: 'Klimaanlage', nameEn: 'Air Conditioning', nameTr: 'Klima', category: 'heating', sortOrder: 12 },
        { name: 'Wärmepumpe', nameEn: 'Heat Pump', nameTr: 'Isı Pompası', category: 'heating', sortOrder: 13 },
        { name: 'Solaranlage / Photovoltaik', nameEn: 'Solar System / Photovoltaics', nameTr: 'Güneş Paneli / Fotovoltaik', category: 'heating', sortOrder: 14 },

        // Security (15-21)
        { name: 'Smarthome-System', nameEn: 'Smart Home System', nameTr: 'Akıllı Ev Sistemi', category: 'security', sortOrder: 15 },
        { name: 'Video-Gegensprechanlage', nameEn: 'Video Intercom', nameTr: 'Görüntülü Kapı Zili', category: 'security', sortOrder: 16 },
        { name: 'Alarmanlage', nameEn: 'Alarm System', nameTr: 'Alarm Sistemi', category: 'security', sortOrder: 17 },
        { name: 'Bewegungsmelder', nameEn: 'Motion Detector', nameTr: 'Hareket Sensörü', category: 'security', sortOrder: 18 },
        { name: 'Elektrische Rollläden', nameEn: 'Electric Shutters', nameTr: 'Elektrikli Panjur', category: 'security', sortOrder: 19 },
        { name: 'Schließsystem (z.B. Transponder)', nameEn: 'Locking System (e.g. Transponder)', nameTr: 'Kilit Sistemi (ör. Transponder)', category: 'security', sortOrder: 20 },
        { name: 'Rauchmelder', nameEn: 'Smoke Detector', nameTr: 'Duman Dedektörü', category: 'security', sortOrder: 21 },

        // Technology (22-24)
        { name: 'Netzwerkverkabelung / LAN in allen Zimmern', nameEn: 'Network Cabling / LAN in All Rooms', nameTr: 'Ağ Kablolaması / Tüm Odalarda LAN', category: 'technology', sortOrder: 22 },
        { name: 'Glasfaseranschluss', nameEn: 'Fiber Optic Connection', nameTr: 'Fiber Optik Bağlantı', category: 'technology', sortOrder: 23 },
        { name: 'Satellitenanschluss / Kabelanschluss', nameEn: 'Satellite / Cable Connection', nameTr: 'Uydu / Kablo Bağlantısı', category: 'technology', sortOrder: 24 },

        // Bathroom (25-30)
        { name: 'Dusche', nameEn: 'Shower', nameTr: 'Duş', category: 'bathroom', sortOrder: 25 },
        { name: 'Badewanne', nameEn: 'Bathtub', nameTr: 'Küvet', category: 'bathroom', sortOrder: 26 },
        { name: 'Gäste-WC', nameEn: 'Guest Toilet', nameTr: 'Misafir Tuvaleti', category: 'bathroom', sortOrder: 27 },
        { name: 'Doppelwaschbecken', nameEn: 'Double Sink', nameTr: 'Çift Lavabo', category: 'bathroom', sortOrder: 28 },
        { name: 'Waschmaschinenanschluss in der Wohnung', nameEn: 'Washing Machine Connection in Apartment', nameTr: 'Dairede Çamaşır Makinesi Bağlantısı', category: 'bathroom', sortOrder: 29 },
        { name: 'Waschraum im Keller', nameEn: 'Laundry Room in Basement', nameTr: 'Bodrum Çamaşır Odası', category: 'bathroom', sortOrder: 30 },

        // Outdoor (31-36)
        { name: 'Balkon', nameEn: 'Balcony', nameTr: 'Balkon', category: 'outdoor', sortOrder: 31 },
        { name: 'Terrasse', nameEn: 'Terrace', nameTr: 'Teras', category: 'outdoor', sortOrder: 32 },
        { name: 'Loggia', nameEn: 'Loggia', nameTr: 'Loggia', category: 'outdoor', sortOrder: 33 },
        { name: 'Garten', nameEn: 'Garden', nameTr: 'Bahçe', category: 'outdoor', sortOrder: 34 },
        { name: 'Gartennutzung', nameEn: 'Garden Use', nameTr: 'Bahçe Kullanımı', category: 'outdoor', sortOrder: 35 },
        { name: 'Wintergarten', nameEn: 'Winter Garden', nameTr: 'Kış Bahçesi', category: 'outdoor', sortOrder: 36 },

        // Storage (37-38)
        { name: 'Abstellraum', nameEn: 'Storage Room', nameTr: 'Depo Odası', category: 'storage', sortOrder: 37 },
        { name: 'Kellerraum', nameEn: 'Basement Room', nameTr: 'Bodrum Odası', category: 'storage', sortOrder: 38 },

        // Accessibility (39-40)
        { name: 'Aufzug', nameEn: 'Elevator', nameTr: 'Asansör', category: 'accessibility', sortOrder: 39 },
        { name: 'Barrierefreiheit', nameEn: 'Accessibility', nameTr: 'Engelsiz Erişim', category: 'accessibility', sortOrder: 40 },

        // Flooring & Interior (41-43)
        { name: 'Tageslichtbad', nameEn: 'Daylight Bathroom', nameTr: 'Gün Işıklı Banyo', category: 'flooring', sortOrder: 41 },
        { name: 'Hochwertiger Bodenbelag (z.B. Parkett, Vinyl)', nameEn: 'High-Quality Flooring (e.g. Parquet, Vinyl)', nameTr: 'Yüksek Kaliteli Zemin (ör. Parke, Vinil)', category: 'flooring', sortOrder: 42 },
        { name: 'Schallschutzfenster', nameEn: 'Soundproof Windows', nameTr: 'Ses Yalıtımlı Pencere', category: 'flooring', sortOrder: 43 },

        // Energy (44-47)
        { name: 'Energiesparende Bauweise (z.B. KfW-Standard)', nameEn: 'Energy-Efficient Construction (e.g. KfW Standard)', nameTr: 'Enerji Tasarruflu Yapı (ör. KfW Standardı)', category: 'energy', sortOrder: 44 },
        { name: 'Dämmung (z.B. Fassaden- oder Dachdämmung)', nameEn: 'Insulation (e.g. Facade or Roof Insulation)', nameTr: 'Yalıtım (ör. Cephe veya Çatı Yalıtımı)', category: 'energy', sortOrder: 45 },
        { name: 'Regenwassernutzung', nameEn: 'Rainwater Usage', nameTr: 'Yağmur Suyu Kullanımı', category: 'energy', sortOrder: 46 },
        { name: 'Energieausweis vorhanden', nameEn: 'Energy Certificate Available', nameTr: 'Enerji Sertifikası Mevcut', category: 'energy', sortOrder: 47 },
      ];

      let created = 0;
      let skipped = 0;

      for (const usageRight of defaultUsageRights) {
        // Check if already exists
        const existing = await tenantPrisma.usageRight.findFirst({
          where: {
            tenantId: tenantContext.id,
            name: usageRight.name,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create usage right
        await tenantPrisma.usageRight.create({
          data: {
            tenantId: tenantContext.id,
            companyId: firstCompany?.id || null,
            name: usageRight.name,
            nameEn: usageRight.nameEn,
            nameTr: usageRight.nameTr,
            category: usageRight.category,
            sortOrder: usageRight.sortOrder,
            isActive: true,
          },
        });
        created++;
      }

      return successResponse({
        created,
        skipped,
      });
    },
    { required: true, module: 'real-estate' }
  );
}
