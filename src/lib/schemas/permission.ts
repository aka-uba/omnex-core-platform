import { z } from 'zod';

// Permission Schema
export const permissionSchema = z.object({
  permissionKey: z.string()
    .min(1, 'Permission key is required')
    .regex(/^[a-z]+\.[a-z_]+$/, 'Permission key format: module.action (e.g., client.create)'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  module: z.string().optional(),
});

export type PermissionFormData = z.infer<typeof permissionSchema>;

// Permission API Response Type
export interface Permission {
  id: string;
  permissionKey: string;
  name: string;
  description: string;
  category: string;
  module?: string;
  createdAt: string;
  updatedAt: string;
}

// Permission List Response
export interface PermissionListResponse {
  permissions: Permission[];
  total: number;
  page: number;
  pageSize: number;
}

// Permission Query Params
export interface PermissionQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  module?: string;
}




