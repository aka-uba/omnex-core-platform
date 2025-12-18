/**
 * Human Resources Module - Types
 */

export type WorkType = 'full_time' | 'part_time' | 'contract';
export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface Employee {
  id: string;
  userId: string;
  tenantId: string;
  companyId: string;
  employeeNumber: string;
  department: string;
  position: string;
  hireDate: Date;
  managerId?: string | null;
  salary?: number | null;
  salaryGroup?: string | null;
  currency: string;
  workType: WorkType;
  metadata?: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface Leave {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  status: LeaveStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: string;
    employeeNumber: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface Payroll {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  period: string; // 'YYYY-MM'
  payDate: Date;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  taxDeduction?: number | null;
  sgkDeduction?: number | null;
  otherDeductions?: number | null;
  bonuses: number;
  overtime: number;
  status: PayrollStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    id: string;
    employeeNumber: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface EmployeeCreateInput {
  userId: string;
  employeeNumber: string;
  department: string;
  position: string;
  hireDate: Date | string;
  managerId?: string;
  salary?: number;
  salaryGroup?: string;
  currency?: string;
  workType: WorkType;
  metadata?: Record<string, unknown>;
}

export interface EmployeeUpdateInput extends Partial<EmployeeCreateInput> {
  isActive?: boolean;
}

export interface LeaveCreateInput {
  employeeId: string;
  type: LeaveType;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason?: string;
}

export interface LeaveUpdateInput extends Partial<LeaveCreateInput> {
  status?: LeaveStatus;
  approvedBy?: string;
}

export interface PayrollCreateInput {
  employeeId: string;
  period: string; // 'YYYY-MM'
  payDate: Date | string;
  grossSalary: number;
  deductions?: number;
  netSalary: number;
  taxDeduction?: number;
  sgkDeduction?: number;
  otherDeductions?: number;
  bonuses?: number;
  overtime?: number;
  status?: PayrollStatus;
  notes?: string;
}

export interface PayrollUpdateInput extends Partial<PayrollCreateInput> {
  status?: PayrollStatus;
}

export interface EmployeeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  position?: string;
  workType?: WorkType;
  isActive?: boolean;
  managerId?: string;
}

export interface LeaveListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  employeeId?: string;
  type?: LeaveType;
  status?: LeaveStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
}

export interface PayrollListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  employeeId?: string;
  period?: string;
  status?: PayrollStatus;
  payDateFrom?: Date;
  payDateTo?: Date;
}







