import { z } from 'zod';

// Role Schema
export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().min(1, 'Description is required'),
  permissions: z.array(z.string()).optional(),
});

export type RoleFormData = z.infer<typeof roleSchema>;

// Role API Response Type
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: string[];
  usersCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Role List Response
export interface RoleListResponse {
  roles: Role[];
  total: number;
  page: number;
  pageSize: number;
}

// Role Query Params
export interface RoleQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  withUsers?: boolean;
}




