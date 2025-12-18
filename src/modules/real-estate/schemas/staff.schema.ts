import { z } from 'zod';

export const staffTypeSchema = z.enum(['internal', 'external']);
export const staffRoleSchema = z.enum(['manager', 'agent', 'accountant', 'maintenance', 'observer']);

export const realEstateStaffSchema = z.object({
  userId: z.string().optional().nullable(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  staffType: staffTypeSchema,
  role: staffRoleSchema,
  permissions: z.record(z.string(), z.any()).optional().nullable(),
  propertyIds: z.array(z.string()).default([]),
  apartmentIds: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
}).refine((data) => {
  if (data.staffType === 'internal') {
    return !!data.userId;
  }
  return true;
}, {
  message: 'User ID is required for internal staff',
  path: ['userId'],
});

export type RealEstateStaffFormValues = z.infer<typeof realEstateStaffSchema>;








