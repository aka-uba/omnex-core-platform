import { z } from 'zod';

// User Status Enum
export const UserStatus = z.enum(['active', 'inactive', 'pending']);
export type UserStatus = z.infer<typeof UserStatus>;

// User Role Enum
export const UserRole = z.enum(['SuperAdmin', 'AgencyUser', 'ClientUser']);
export type UserRole = z.infer<typeof UserRole>;

// Personal Information Schema
export const personalInfoSchema = z.object({
  profilePicture: z.instanceof(File).optional(),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If password is provided, confirmPassword must match
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Work Information Schema
export const workInfoSchema = z.object({
  department: z.string().optional(),
  position: z.string().optional(),
  employeeId: z.string().optional(),
  hireDate: z.date().optional(),
  manager: z.string().optional(),
  agencyIds: z.array(z.string()).optional(),
  role: UserRole,
});

// Contact Information Schema
export const contactInfoSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

// Documents Schema
export const documentsSchema = z.object({
  passport: z.instanceof(File).optional(),
  idCard: z.instanceof(File).optional(),
  contract: z.instanceof(File).optional(),
  otherDocuments: z.array(z.instanceof(File)).optional(),
});

// CV Schema
export const cvSchema = z.object({
  cv: z.instanceof(File).optional(),
});

// Preferences Schema
export const preferencesSchema = z.object({
  defaultLanguage: z.string().default('tr'),
  defaultTheme: z.enum(['light', 'dark', 'auto']).default('auto'),
  defaultLayout: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
});

// Complete User Schema (for create/edit)
export const userFormSchema = z.object({
  personal: personalInfoSchema,
  work: workInfoSchema,
  contact: contactInfoSchema.optional(),
  documents: documentsSchema.optional(),
  cv: cvSchema.optional(),
  preferences: preferencesSchema.optional(),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type WorkInfo = z.infer<typeof workInfoSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type Documents = z.infer<typeof documentsSchema>;
export type CV = z.infer<typeof cvSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type UserFormData = z.infer<typeof userFormSchema>;

// User API Response Type
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  agencyId?: string;
  profilePicture?: string;
  phone?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  hireDate?: string;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

// User List Response
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

// User Query Params
export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  agencyId?: string;
}




