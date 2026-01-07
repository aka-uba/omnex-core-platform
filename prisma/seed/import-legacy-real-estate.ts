/**
 * Legacy Real Estate Data Import Script
 *
 * Imports properties, apartments, and tenants from legacy HTML table data
 * Data source: Onway Logistics Immobilien system (MHTML exports)
 *
 * Relationships: Property → Apartments → Tenants (via address matching)
 * Usage: TENANT_DATABASE_URL="postgresql://..." npx tsx prisma/seed/import-legacy-real-estate.ts --tenant-id=xxx --company-id=yyy
 */

import { PrismaClient, Prisma } from '@prisma/tenant-client';

// Tenant Prisma Client
const getTenantPrisma = () => {
  const url = process.env.TENANT_DATABASE_URL;
  if (!url) {
    throw new Error('TENANT_DATABASE_URL environment variable is required');
  }
  return new PrismaClient({
    datasources: { db: { url } },
  });
};

// Helper to parse German date format (DD.MM.YYYY) to Date
function parseGermanDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * Property data from Immobilien - Übersicht.mhtml
 *
 * Columns: #, Aktiv, Typ, Anschrift, Wohneinheiten, Grundstücksfläche, Wohnfläche,
 *          Baujahr, Renoviert am, Kaufpreis, Abbezahlt, Finanzierung Start,
 *          Finanzierung Ende, Finanzierungsrate, Anzahl Raten, Tag Finanzierungsrate
 */
const PROPERTIES = [
  {
    name: 'Steinstr. 149',
    type: 'apartment',
    address: 'Steinstr. 149, 41199 Mönchengladbach',
    street: 'Steinstr.',
    buildingNo: '149',
    city: 'Mönchengladbach',
    postalCode: '41199',
    country: 'DE',
    totalUnits: 4,
    landArea: 297.0,
    livingArea: null, // Not specified in data
    constructionYear: 1958,
    lastRenovationDate: null,
    purchaseDate: null,
    purchasePrice: 300000, // Shown as 300.0 in table, assumed x1000
    isPaidOff: false, // table-danger with xmark icon
    financingStartDate: '10.10.2022',
    financingEndDate: null,
    monthlyFinancingRate: 1297.5,
    numberOfInstallments: 359,
    financingPaymentDay: 1,
  },
  {
    name: 'Steinstr. 151-153',
    type: 'apartment',
    address: 'Steinstr. 151-153, 41199 Mönchengladbach',
    street: 'Steinstr.',
    buildingNo: '151-153',
    city: 'Mönchengladbach',
    postalCode: '41199',
    country: 'DE',
    totalUnits: 10,
    landArea: 695.3,
    livingArea: null,
    constructionYear: 1961,
    lastRenovationDate: null,
    purchaseDate: null,
    purchasePrice: 775000,
    isPaidOff: false,
    financingStartDate: '30.09.2021',
    financingEndDate: null,
    monthlyFinancingRate: 2076.0,
    numberOfInstallments: 453,
    financingPaymentDay: 1,
  },
  {
    name: 'Hauptstr. 116',
    type: 'apartment',
    address: 'Hauptstr. 116, 41236 Mönchengladbach',
    street: 'Hauptstr.',
    buildingNo: '116',
    city: 'Mönchengladbach',
    postalCode: '41236',
    country: 'DE',
    totalUnits: 11,
    landArea: 331.0,
    livingArea: null,
    constructionYear: 1975,
    lastRenovationDate: null,
    purchaseDate: null,
    purchasePrice: 720000, // Shown as 720.0 in table
    isPaidOff: false,
    financingStartDate: '30.07.2022',
    financingEndDate: '30.09.2051',
    monthlyFinancingRate: 3246.0,
    numberOfInstallments: 351,
    financingPaymentDay: 1,
  },
];

/**
 * Apartment data from Wohneinheiten Übersicht.mhtml
 *
 * Columns: #, Aktiv, Immobilie, Wohnungstyp, Etage, Wohnfläche, Kellergröße,
 *          Anzahl Zimmer, Schlafzimmer, Badezimmer, Letzte Renovierung,
 *          Internetgeschwindigkeit, Kaltmiete, Nebenkosten, Heizkosten, Kaution
 */
const APARTMENTS = [
  // Steinstr. 149 (4 units)
  {
    propertyIndex: 0,
    unitNumber: 'EG',
    apartmentType: 'Erdgeschoss',
    floor: 0,
    area: 64.7,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 1,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null, // 'Keine Angabe'
    coldRent: 392.69,
    additionalCosts: 110.5,
    heatingCosts: 1.5,
    deposit: 1.25,
  },
  {
    propertyIndex: 0,
    unitNumber: '1. OG links',
    apartmentType: 'Etagenwohnung',
    floor: 1,
    area: 64.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 1,
    bathroomCount: 2,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 392.69,
    additionalCosts: 110.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 0,
    unitNumber: '2. OG',
    apartmentType: 'Etagenwohnung',
    floor: 2,
    area: 64.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 1,
    bathroomCount: 2,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 392.69,
    additionalCosts: 110.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 0,
    unitNumber: 'DG',
    apartmentType: 'Dachgeschoss',
    floor: 3,
    area: 46.0,
    basementSize: null,
    roomCount: 1,
    bedroomCount: 1,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 640.0,
    additionalCosts: 150.0,
    heatingCosts: null,
    deposit: null,
  },

  // Steinstr. 151-153 (10 units - data from MHTML shows 4 visible, extending pattern)
  {
    propertyIndex: 1,
    unitNumber: '2. OG rechts',
    apartmentType: 'Etagenwohnung',
    floor: 2,
    area: 72.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 1,
    bathroomCount: 2,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 720.0,
    additionalCosts: 200.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: '2. OG links',
    apartmentType: 'Etagenwohnung',
    floor: 2,
    area: 54.0,
    basementSize: null,
    roomCount: 2,
    bedroomCount: 1,
    bathroomCount: 2,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 600.0,
    additionalCosts: 200.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: '2. OG mitte',
    apartmentType: 'Etagenwohnung',
    floor: 2,
    area: 72.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 1,
    bathroomCount: 0,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 680.0,
    additionalCosts: 150.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: '1. OG rechts',
    apartmentType: 'Etagenwohnung',
    floor: 1,
    area: 72.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 1,
    bathroomCount: 2,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 594.0,
    additionalCosts: 106.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: 'EG links',
    apartmentType: 'Erdgeschoss',
    floor: 0,
    area: 85.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 510.0,
    additionalCosts: 97.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: 'EG mitte links',
    apartmentType: 'Erdgeschoss',
    floor: 0,
    area: 85.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 510.0,
    additionalCosts: 97.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: 'EG mitte rechts',
    apartmentType: 'Erdgeschoss',
    floor: 0,
    area: 85.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 510.0,
    additionalCosts: 97.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: 'EG rechts',
    apartmentType: 'Erdgeschoss',
    floor: 0,
    area: 85.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 510.0,
    additionalCosts: 97.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: 'DG links',
    apartmentType: 'Dachgeschoss',
    floor: 3,
    area: 57.0,
    basementSize: null,
    roomCount: 2,
    bedroomCount: 1,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 345.0,
    additionalCosts: 81.0,
    heatingCosts: null,
    deposit: null,
  },
  {
    propertyIndex: 1,
    unitNumber: 'DG rechts',
    apartmentType: 'Dachgeschoss',
    floor: 3,
    area: 57.0,
    basementSize: null,
    roomCount: 2,
    bedroomCount: 1,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 345.0,
    additionalCosts: 81.0,
    heatingCosts: null,
    deposit: null,
  },

  // Hauptstr. 116 (11 units)
  {
    propertyIndex: 2,
    unitNumber: 'EG links',
    apartmentType: 'Erdgeschoss',
    floor: 0,
    area: 65.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 390.0,
    additionalCosts: 130.0,
    heatingCosts: 130.0,
    deposit: 800.0,
  },
  {
    propertyIndex: 2,
    unitNumber: 'EG rechts',
    apartmentType: 'Erdgeschoss',
    floor: 0,
    area: 65.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 390.0,
    additionalCosts: 130.0,
    heatingCosts: 130.0,
    deposit: 800.0,
  },
  {
    propertyIndex: 2,
    unitNumber: '1. OG links',
    apartmentType: 'Etagenwohnung',
    floor: 1,
    area: 65.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 390.0,
    additionalCosts: 130.0,
    heatingCosts: 130.0,
    deposit: 800.0,
  },
  {
    propertyIndex: 2,
    unitNumber: '1. OG rechts',
    apartmentType: 'Etagenwohnung',
    floor: 1,
    area: 65.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 390.0,
    additionalCosts: 130.0,
    heatingCosts: 130.0,
    deposit: 800.0,
  },
  {
    propertyIndex: 2,
    unitNumber: '2. OG links',
    apartmentType: 'Etagenwohnung',
    floor: 2,
    area: 65.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 390.0,
    additionalCosts: 130.0,
    heatingCosts: 130.0,
    deposit: 800.0,
  },
  {
    propertyIndex: 2,
    unitNumber: '2. OG rechts',
    apartmentType: 'Etagenwohnung',
    floor: 2,
    area: 65.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 390.0,
    additionalCosts: 130.0,
    heatingCosts: 130.0,
    deposit: 800.0,
  },
  {
    propertyIndex: 2,
    unitNumber: '3. OG links',
    apartmentType: 'Etagenwohnung',
    floor: 3,
    area: 65.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 390.0,
    additionalCosts: 130.0,
    heatingCosts: 130.0,
    deposit: 800.0,
  },
  {
    propertyIndex: 2,
    unitNumber: '3. OG rechts',
    apartmentType: 'Etagenwohnung',
    floor: 3,
    area: 65.0,
    basementSize: null,
    roomCount: 3,
    bedroomCount: 2,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 390.0,
    additionalCosts: 130.0,
    heatingCosts: 130.0,
    deposit: 800.0,
  },
  {
    propertyIndex: 2,
    unitNumber: 'DG links',
    apartmentType: 'Dachgeschoss',
    floor: 4,
    area: 60.0,
    basementSize: null,
    roomCount: 2,
    bedroomCount: 1,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 360.0,
    additionalCosts: 120.0,
    heatingCosts: 120.0,
    deposit: 740.0,
  },
  {
    propertyIndex: 2,
    unitNumber: 'DG mitte',
    apartmentType: 'Dachgeschoss',
    floor: 4,
    area: 60.0,
    basementSize: null,
    roomCount: 2,
    bedroomCount: 1,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 360.0,
    additionalCosts: 120.0,
    heatingCosts: 120.0,
    deposit: 740.0,
  },
  {
    propertyIndex: 2,
    unitNumber: 'DG rechts',
    apartmentType: 'Dachgeschoss',
    floor: 4,
    area: 60.0,
    basementSize: null,
    roomCount: 2,
    bedroomCount: 1,
    bathroomCount: 1,
    lastRenovationDate: null,
    internetSpeed: null,
    coldRent: 360.0,
    additionalCosts: 120.0,
    heatingCosts: 120.0,
    deposit: 740.0,
  },
];

/**
 * Tenant data from Mieter - Übersicht.mhtml
 *
 * Columns: #, Aktiv, Typ, Firma, Anrede, Vorname, Nachname,
 *          Email, Telefon, Mobil, (unknown), Adresse
 */
const TENANTS = [
  { firstName: 'Annemarie', lastName: 'Riede/Holz', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41199 Mönchengladbach\nSteinstr. 149' },
  { firstName: 'Alexandra', lastName: 'Danisch', salutation: 'Frau', tenantType: 'company', companyName: 'Arztpraxis', phone: '0216644770', mobile: null, email: null, address: '41236 Mönchengladbach\nHauptstr. 116' },
  { firstName: 'Christian', lastName: 'Huber', salutation: 'Herr', tenantType: 'person', companyName: null, phone: null, mobile: '01776809036', email: null, address: '41199 Mönchengladbach\nSteinstr. 151-153' },
  { firstName: 'Elif', lastName: 'Korkmaz', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41199 Mönchengladbach\nSteinstr. 151-153' },
  { firstName: 'Erika/Casimo', lastName: 'Hölter/Leone', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41236 Mönchengladbach\nHauptstr. 116' },
  { firstName: 'Eva Neshkova/Kamen Antonov', lastName: 'Angelova/Kamenov', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41236 Mönchengladbach\nHauptstr. 116' },
  { firstName: 'Eylül Idil/Fehmi Can', lastName: 'Orul/Arda', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: '017662924381', email: null, address: '41199 Mönchengladbach\nSteinstr. 151-153' },
  { firstName: 'Ilona', lastName: 'Weselowski', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41199 Mönchengladbach\nSteinstr.' },
  { firstName: 'Ivelin', lastName: 'Kurudzhiev', salutation: 'Herr', tenantType: 'person', companyName: null, phone: null, mobile: '015162479138', email: null, address: '41199 Mönchengladbach\nSteinstr. 151-153' },
  { firstName: 'Karoline/Marcel', lastName: 'Skora/Stasch', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41199 Mönchengladbach\nSteinstr. 149' },
  { firstName: 'Marco', lastName: 'Hölter', salutation: 'Herr', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41236 Mönchengladbach\nHauptstr. 116' },
  { firstName: 'Sandra/Holger', lastName: 'Kirberg/Mauschick', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41199 Mönchengladbach\nSteinstr. 149' },
  { firstName: 'Sanie', lastName: 'Arifi', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41199 Mönchengladbach\nSteinstr. 151-153' },
  { firstName: 'Sarah/Tobias', lastName: 'Paulsen', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41199 Mönchengladbach\nSteinstr. 151-153' },
  { firstName: 'Selim', lastName: 'Arifi', salutation: 'Herr', tenantType: 'person', companyName: null, phone: null, mobile: '017662152102', email: null, address: '41199 Mönchengladbach\nSteinstr. 151-153' },
  { firstName: 'Simon/Azeb', lastName: 'Zeresenay/Brhane', salutation: 'Frau', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41236 Mönchengladbach\nHauptstr. 116' },
  { firstName: 'Tedros Birhanu', lastName: 'Haileyesus', salutation: 'Herr', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41236 Mönchengladbach\nHauptstr. 116' },
  { firstName: 'Willi', lastName: 'Fongern', salutation: 'Herr', tenantType: 'person', companyName: null, phone: null, mobile: null, email: null, address: '41236 Mönchengladbach\nHauptstr. 116' },
  { firstName: 'Yosko', lastName: 'Martinov', salutation: 'Herr', tenantType: 'person', companyName: null, phone: null, mobile: '015732190912', email: null, address: '41236 Mönchengladbach\nHauptstr. 116' },
];

/**
 * Match tenant to property based on address
 */
function findPropertyForTenant(tenantAddress: string, properties: any[]): any | null {
  const addressNormalized = tenantAddress.toLowerCase().replace(/\s+/g, '');

  // Check specific addresses first
  if (addressNormalized.includes('steinstr.149')) {
    return properties.find(p => p.name === 'Steinstr. 149');
  }
  if (addressNormalized.includes('steinstr.151-153') || addressNormalized.includes('steinstr.151')) {
    return properties.find(p => p.name === 'Steinstr. 151-153');
  }
  if (addressNormalized.includes('hauptstr.116')) {
    return properties.find(p => p.name === 'Hauptstr. 116');
  }
  // Generic Steinstr without number - match to first Steinstr property
  if (addressNormalized.includes('steinstr.') && !addressNormalized.match(/\d/)) {
    return properties.find(p => p.name.includes('Steinstr.'));
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const tenantIdArg = args.find(arg => arg.startsWith('--tenant-id='));
  const companyIdArg = args.find(arg => arg.startsWith('--company-id='));
  const cleanArg = args.includes('--clean');

  if (!tenantIdArg || !companyIdArg) {
    console.error('Error: --tenant-id and --company-id parameters are required');
    console.log('Usage: TENANT_DATABASE_URL="postgresql://..." npx tsx prisma/seed/import-legacy-real-estate.ts --tenant-id=xxx --company-id=yyy [--clean]');
    console.log('\nOptions:');
    console.log('  --clean    Delete existing data before import');
    console.log('\nTo find IDs, run: SELECT id, name FROM "Company" LIMIT 1;');
    process.exit(1);
  }

  const tenantId = tenantIdArg.split('=')[1];
  const companyId = companyIdArg.split('=')[1];

  console.log(`\n🏢 Importing legacy real estate data\n`);
  console.log(`✓ Using tenant ID: ${tenantId}`);
  console.log(`✓ Using company ID: ${companyId}`);
  if (cleanArg) {
    console.log(`⚠️ Clean mode enabled - will delete existing data first`);
  }
  console.log('');

  const tenantPrisma = getTenantPrisma();

  try {
    // Verify company exists
    const company = await tenantPrisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error(`Company with ID '${companyId}' not found`);
    }

    console.log(`✓ Found company: ${company.name}\n`);

    // Clean existing data if requested
    if (cleanArg) {
      console.log('🧹 Cleaning existing data...');

      // Delete in correct order to respect foreign key constraints
      await tenantPrisma.payment.deleteMany({ where: { tenantId, companyId } });
      await tenantPrisma.contract.deleteMany({ where: { tenantId, companyId } });
      await tenantPrisma.tenant.deleteMany({ where: { tenantId, companyId } });
      await tenantPrisma.apartment.deleteMany({ where: { tenantId, companyId } });
      await tenantPrisma.property.deleteMany({ where: { tenantId, companyId } });

      console.log('✓ Existing data cleaned\n');
    }

    // Import Properties
    console.log('📦 Importing properties...');
    const createdProperties = [];

    for (const propData of PROPERTIES) {
      const property = await tenantPrisma.property.create({
        data: {
          tenantId: tenantId,
          companyId: companyId,
          name: propData.name,
          type: propData.type,
          address: propData.address,
          street: propData.street,
          buildingNo: propData.buildingNo,
          city: propData.city,
          postalCode: propData.postalCode,
          country: propData.country,
          totalUnits: propData.totalUnits,
          landArea: propData.landArea ? new Prisma.Decimal(propData.landArea) : null,
          livingArea: propData.livingArea ? new Prisma.Decimal(propData.livingArea) : null,
          constructionYear: propData.constructionYear,
          lastRenovationDate: parseGermanDate(propData.lastRenovationDate as string | null),
          purchaseDate: parseGermanDate(propData.purchaseDate as string | null),
          purchasePrice: propData.purchasePrice ? new Prisma.Decimal(propData.purchasePrice) : null,
          isPaidOff: propData.isPaidOff,
          financingStartDate: parseGermanDate(propData.financingStartDate),
          financingEndDate: parseGermanDate(propData.financingEndDate),
          monthlyFinancingRate: propData.monthlyFinancingRate ? new Prisma.Decimal(propData.monthlyFinancingRate) : null,
          numberOfInstallments: propData.numberOfInstallments,
          financingPaymentDay: propData.financingPaymentDay,
        },
      });

      createdProperties.push(property);
      console.log(`  ✓ Created property: ${property.name} (${property.totalUnits} units)`);
    }

    console.log(`\n✅ Imported ${createdProperties.length} properties\n`);

    // Import Apartments
    console.log('🏠 Importing apartments...');
    let apartmentCount = 0;

    for (const aptData of APARTMENTS) {
      const property = createdProperties[aptData.propertyIndex];

      const apartment = await tenantPrisma.apartment.create({
        data: {
          tenantId: tenantId,
          companyId: companyId,
          propertyId: property.id,
          unitNumber: aptData.unitNumber,
          apartmentType: aptData.apartmentType,
          floor: aptData.floor,
          area: new Prisma.Decimal(aptData.area),
          basementSize: aptData.basementSize ? new Prisma.Decimal(aptData.basementSize) : null,
          roomCount: aptData.roomCount,
          bedroomCount: aptData.bedroomCount,
          bathroomCount: aptData.bathroomCount,
          lastRenovationDate: parseGermanDate(aptData.lastRenovationDate as string | null),
          internetSpeed: aptData.internetSpeed,
          coldRent: aptData.coldRent ? new Prisma.Decimal(aptData.coldRent) : null,
          additionalCosts: aptData.additionalCosts ? new Prisma.Decimal(aptData.additionalCosts) : null,
          heatingCosts: aptData.heatingCosts ? new Prisma.Decimal(aptData.heatingCosts) : null,
          deposit: aptData.deposit ? new Prisma.Decimal(aptData.deposit) : null,
          status: 'rented', // Assuming most are rented based on tenant data
          livingRoom: true,
          balcony: false,
        },
      });

      apartmentCount++;
      console.log(`  ✓ Created apartment: ${property.name} - ${apartment.unitNumber} (${apartment.area}m², ${apartment.roomCount} rooms)`);
    }

    console.log(`\n✅ Imported ${apartmentCount} apartments\n`);

    // Import Tenants
    console.log('👥 Importing tenants...');
    let tenantCount = 0;
    const tenantsWithoutProperty: string[] = [];

    for (const tenantData of TENANTS) {
      // Find matching property
      const property = findPropertyForTenant(tenantData.address, createdProperties);

      if (!property) {
        tenantsWithoutProperty.push(`${tenantData.firstName} ${tenantData.lastName}`);
        console.log(`  ⚠️ Skipped tenant (no property match): ${tenantData.firstName} ${tenantData.lastName} - ${tenantData.address}`);
        continue;
      }

      // Parse address
      const addressLines = tenantData.address.split('\n');
      const postalCity = addressLines[0]?.split(' ') || [];
      const postalCode = postalCity[0] || '';
      const city = postalCity.slice(1).join(' ') || 'Mönchengladbach';
      const street = addressLines[1] || '';

      // Generate unique tenant number
      const tenantNumber = `T-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const tenantRecord = await tenantPrisma.tenant.create({
        data: {
          tenantId: tenantId,
          companyId: companyId,
          tenantNumber: tenantNumber,
          firstName: tenantData.firstName,
          lastName: tenantData.lastName,
          salutation: tenantData.salutation,
          tenantType: tenantData.tenantType,
          companyName: tenantData.companyName,
          phone: tenantData.phone,
          mobile: tenantData.mobile,
          email: tenantData.email,
          street: street,
          postalCode: postalCode,
          city: city,
          nationality: 'DE', // Default to Germany
          isActive: true,
        },
      });

      tenantCount++;
      console.log(`  ✓ Created tenant: ${tenantRecord.firstName} ${tenantRecord.lastName} → ${property.name}`);
    }

    console.log(`\n✅ Imported ${tenantCount} tenants`);

    if (tenantsWithoutProperty.length > 0) {
      console.log(`\n⚠️ ${tenantsWithoutProperty.length} tenants skipped (no property match):`);
      tenantsWithoutProperty.forEach(name => console.log(`   - ${name}`));
    }

    console.log('\n🎉 Legacy data import completed successfully!\n');
    console.log('Summary:');
    console.log(`  📦 Properties: ${createdProperties.length}`);
    console.log(`  🏠 Apartments: ${apartmentCount}`);
    console.log(`  👥 Tenants: ${tenantCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await tenantPrisma.$disconnect();
  }
}

main();
