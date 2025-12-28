import type { ReconciliationApartmentDetail, DistributionMethod } from '../types/property-expense';

interface ApartmentData {
  id: string;
  unitNumber: string;
  area: number;
  additionalCosts: number; // Aylık tahmini yan gider
  contracts: Array<{
    id: string;
    status: string;
    startDate: Date;
    endDate?: Date | null;
    tenantRecord?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  }>;
}

interface CalculationInput {
  totalExpenses: number;
  apartments: ApartmentData[];
  distributionMethod: DistributionMethod;
  year: number;
  fiscalYearStart?: Date;
  fiscalYearEnd?: Date;
}

interface CalculationResult {
  apartmentCount: number;
  perApartmentShare: number;
  details: ReconciliationApartmentDetail[];
  totalDebt: number;
  totalCredit: number;
}

/**
 * Yıl sonu yan gider uzlaştırma hesaplaması
 * Almanya Nebenkostenabrechnung sistemine göre
 */
export function calculateReconciliation(input: CalculationInput): CalculationResult {
  const { totalExpenses, apartments, distributionMethod, year, fiscalYearStart, fiscalYearEnd } = input;

  // Mali yıl başlangıç ve bitiş
  const yearStart = fiscalYearStart || new Date(year, 0, 1); // 1 Ocak
  const yearEnd = fiscalYearEnd || new Date(year, 11, 31, 23, 59, 59); // 31 Aralık

  // Toplam alan hesapla (metrekare bazlı dağıtım için)
  const totalArea = apartments.reduce((sum, apt) => sum + apt.area, 0);

  // Daire başı payları hesapla
  const details: ReconciliationApartmentDetail[] = apartments.map(apt => {
    // Dairenin payını hesapla
    let actualShare: number;

    switch (distributionMethod) {
      case 'area_based':
        // Metrekare bazlı dağıtım
        actualShare = totalArea > 0 ? (apt.area / totalArea) * totalExpenses : 0;
        break;
      case 'equal':
      default:
        // Eşit dağıtım
        actualShare = apartments.length > 0 ? totalExpenses / apartments.length : 0;
        break;
    }

    // Kirada olunan ay sayısını hesapla
    const monthsOccupied = calculateMonthsOccupied(apt.contracts, yearStart, yearEnd);

    // Aylık tahmini yan gider x kirada olunan ay = toplam ödenen tahmini
    const estimatedMonthlyCost = apt.additionalCosts || 0;
    const totalEstimatedPaid = estimatedMonthlyCost * monthsOccupied;

    // Fark hesapla: Gerçek pay - Ödenen tahmini
    // + değer = kiracı borçlu (az ödemiş)
    // - değer = kiracı alacaklı (fazla ödemiş)
    const difference = actualShare - totalEstimatedPaid;

    // Aktif kiracı bilgisi
    const activeContract = apt.contracts.find(c => c.status === 'active');
    const tenantInfo = activeContract?.tenantRecord
      ? {
          tenantId: activeContract.tenantRecord.id,
          name: `${activeContract.tenantRecord.firstName || ''} ${activeContract.tenantRecord.lastName || ''}`.trim(),
        }
      : undefined;

    return {
      apartmentId: apt.id,
      unitNumber: apt.unitNumber,
      area: apt.area,
      estimatedMonthlyCost,
      monthsOccupied,
      totalEstimatedPaid,
      actualShare: Math.round(actualShare * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      status: difference > 0.01 ? 'debt' : difference < -0.01 ? 'credit' : 'balanced',
      tenantInfo,
    };
  });

  // Daire başı ortalama pay
  const perApartmentShare = apartments.length > 0 ? totalExpenses / apartments.length : 0;

  // Toplam borç ve alacak
  const totalDebt = details
    .filter(d => d.status === 'debt')
    .reduce((sum, d) => sum + d.difference, 0);

  const totalCredit = details
    .filter(d => d.status === 'credit')
    .reduce((sum, d) => sum + Math.abs(d.difference), 0);

  return {
    apartmentCount: apartments.length,
    perApartmentShare: Math.round(perApartmentShare * 100) / 100,
    details,
    totalDebt: Math.round(totalDebt * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
  };
}

/**
 * Bir dairenin yıl içinde kirada olduğu ay sayısını hesaplar
 */
function calculateMonthsOccupied(
  contracts: ApartmentData['contracts'],
  yearStart: Date,
  yearEnd: Date
): number {
  let totalMonths = 0;

  for (const contract of contracts) {
    if (contract.status === 'terminated' || contract.status === 'cancelled') {
      continue;
    }

    const contractStart = new Date(contract.startDate);
    const contractEnd = contract.endDate ? new Date(contract.endDate) : yearEnd;

    // Sözleşme yıl aralığı ile kesişiyor mu?
    if (contractEnd < yearStart || contractStart > yearEnd) {
      continue;
    }

    // Kesişim aralığını bul
    const effectiveStart = contractStart > yearStart ? contractStart : yearStart;
    const effectiveEnd = contractEnd < yearEnd ? contractEnd : yearEnd;

    // Ay farkını hesapla
    const months = calculateMonthDifference(effectiveStart, effectiveEnd);
    totalMonths += months;
  }

  // Maximum 12 ay
  return Math.min(totalMonths, 12);
}

/**
 * İki tarih arasındaki ay farkını hesaplar (kısmi aylar dahil)
 */
function calculateMonthDifference(start: Date, end: Date): number {
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const startDay = start.getDate();

  const endYear = end.getFullYear();
  const endMonth = end.getMonth();
  const endDay = end.getDate();

  // Tam ay sayısı
  let months = (endYear - startYear) * 12 + (endMonth - startMonth);

  // Kısmi ayları hesapla
  const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate();

  // Başlangıç ayının kalan günleri
  const startMonthRatio = (daysInStartMonth - startDay + 1) / daysInStartMonth;

  // Bitiş ayının geçen günleri
  const endMonthRatio = endDay / daysInEndMonth;

  // Tam aylar + kısmi aylar
  if (months === 0) {
    // Aynı ay içinde
    return (endDay - startDay + 1) / daysInStartMonth;
  }

  // Farklı aylar
  return months - 1 + startMonthRatio + endMonthRatio;
}

/**
 * Gider kategorilerine göre özet
 */
export function summarizeByCategory(
  expenses: Array<{ category: string; amount: number }>
): Record<string, number> {
  return expenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>
  );
}
