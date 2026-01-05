import { z } from 'zod';

export const workTypeSchema = z.enum(['full_time', 'part_time', 'contract']);
export const leaveTypeSchema = z.enum(['annual', 'sick', 'unpaid', 'maternity']);
export const leaveStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export const payrollStatusSchema = z.enum(['draft', 'approved', 'paid']);

export const employeeSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  employeeNumber: z.string().min(1, 'Employee number is required'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  hireDate: z.string().datetime('Hire date must be a valid date'),
  managerId: z.string().uuid().optional().nullable(),
  salary: z.number().min(0, 'Salary must be greater than or equal to 0').optional().nullable(),
  salaryGroup: z.string().optional().nullable(),
  currency: z.preprocess((val) => val ?? 'TRY', z.string()),
  workType: workTypeSchema,
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const employeeCreateSchema = employeeSchema.omit({ isActive: true });
export const employeeUpdateSchema = employeeSchema.partial();

export const leaveSchema = z.object({
  employeeId: z.string().uuid('Employee ID must be a valid UUID'),
  type: leaveTypeSchema,
  startDate: z.string().datetime('Start date must be a valid date'),
  endDate: z.string().datetime('End date must be a valid date'),
  days: z.number().int().min(1, 'Days must be at least 1'),
  status: leaveStatusSchema.default('pending'),
  approvedBy: z.string().uuid().optional().nullable(),
  reason: z.string().optional().nullable(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

export type LeaveFormValues = z.infer<typeof leaveSchema>;

export const leaveCreateSchema = leaveSchema.omit({ status: true, approvedBy: true });
export const leaveUpdateSchema = leaveSchema.partial();

export const payrollSchema = z.object({
  employeeId: z.string().uuid('Employee ID must be a valid UUID'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  payDate: z.string().datetime('Pay date must be a valid date'),
  grossSalary: z.number().min(0, 'Gross salary must be greater than or equal to 0'),
  deductions: z.number().min(0, 'Deductions must be greater than or equal to 0').default(0),
  netSalary: z.number().min(0, 'Net salary must be greater than or equal to 0'),
  taxDeduction: z.number().min(0).optional().nullable(),
  sgkDeduction: z.number().min(0).optional().nullable(),
  otherDeductions: z.number().min(0).optional().nullable(),
  bonuses: z.number().min(0).default(0),
  overtime: z.number().min(0).default(0),
  status: payrollStatusSchema.default('draft'),
  notes: z.string().optional().nullable(),
}).refine((data) => {
  return data.netSalary <= data.grossSalary;
}, {
  message: 'Net salary cannot be greater than gross salary',
  path: ['netSalary'],
});

export type PayrollFormValues = z.infer<typeof payrollSchema>;

export const payrollCreateSchema = payrollSchema.omit({ status: true });
export const payrollUpdateSchema = payrollSchema.partial();

