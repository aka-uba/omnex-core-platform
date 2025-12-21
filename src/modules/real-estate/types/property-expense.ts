// PropertyExpense Types

export type ExpenseCategory =
  | 'utilities'    // Elektrik, Su, Gaz
  | 'maintenance'  // Bakım
  | 'insurance'    // Sigorta
  | 'taxes'        // Vergiler
  | 'management'   // Yönetim ücreti
  | 'cleaning'     // Temizlik
  | 'heating'      // Isıtma
  | 'other';       // Diğer

export type DistributionMethod = 'equal' | 'area_based' | 'custom';

export interface PropertyExpense {
  id: string;
  tenantId: string;
  companyId: string;
  propertyId: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  year: number;
  month?: number;
  description?: string;
  receiptUrl?: string;
  invoiceNumber?: string;
  vendorName?: string;
  isDistributed: boolean;
  distributionMethod?: DistributionMethod;
  distributedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
  };
}

export interface PropertyExpenseCreate {
  propertyId: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  year: number;
  month?: number;
  description?: string;
  receiptUrl?: string;
  invoiceNumber?: string;
  vendorName?: string;
}

export interface PropertyExpenseUpdate extends Partial<PropertyExpenseCreate> {
  isActive?: boolean;
  isDistributed?: boolean;
  distributionMethod?: DistributionMethod;
}

// SideCostReconciliation Types

export type ReconciliationStatus = 'draft' | 'calculated' | 'finalized' | 'cancelled';

export interface ReconciliationApartmentDetail {
  apartmentId: string;
  unitNumber: string;
  area: number;

  // Tahmin edilen (aylık yan gider x kirada olunan ay)
  estimatedMonthlyCost: number;
  monthsOccupied: number;
  totalEstimatedPaid: number;

  // Gerçekleşen (hesaplanan pay)
  actualShare: number;

  // Fark (+ borç, - alacak)
  difference: number;
  status: 'debt' | 'credit' | 'balanced';

  // Kiracı bilgisi
  tenantInfo?: {
    tenantId: string;
    name: string;
  };
}

export interface SideCostReconciliation {
  id: string;
  tenantId: string;
  companyId: string;
  propertyId: string;
  year: number;
  totalExpenses: number;
  apartmentCount: number;
  perApartmentShare: number;
  distributionMethod: DistributionMethod;
  fiscalYearStart?: string;
  fiscalYearEnd?: string;
  status: ReconciliationStatus;
  calculatedAt?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  details: ReconciliationApartmentDetail[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
  };
}

export interface ReconciliationCreate {
  propertyId: string;
  year: number;
  distributionMethod: DistributionMethod;
  fiscalYearStart?: string;
  fiscalYearEnd?: string;
  notes?: string;
}

export interface ReconciliationUpdate {
  distributionMethod?: DistributionMethod;
  fiscalYearStart?: string;
  fiscalYearEnd?: string;
  notes?: string;
  status?: ReconciliationStatus;
}

// Gider Kategorisi Çeviriler
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, { tr: string; en: string; de: string }> = {
  utilities: { tr: 'Elektrik/Su/Gaz', en: 'Utilities', de: 'Nebenkosten' },
  maintenance: { tr: 'Bakım', en: 'Maintenance', de: 'Wartung' },
  insurance: { tr: 'Sigorta', en: 'Insurance', de: 'Versicherung' },
  taxes: { tr: 'Vergiler', en: 'Taxes', de: 'Steuern' },
  management: { tr: 'Yönetim Ücreti', en: 'Management Fee', de: 'Verwaltungskosten' },
  cleaning: { tr: 'Temizlik', en: 'Cleaning', de: 'Reinigung' },
  heating: { tr: 'Isıtma', en: 'Heating', de: 'Heizung' },
  other: { tr: 'Diğer', en: 'Other', de: 'Sonstige' },
};
