'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, UserListResponse, UserQueryParams, UserFormData } from '@/lib/schemas/user';

const API_BASE = '/api/users';

// Fetch users list
export function useUsers(params?: UserQueryParams) {
  return useQuery<UserListResponse>({
    queryKey: ['users', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.role) searchParams.set('role', params.role);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.agencyId) searchParams.set('agencyId', params.agencyId);

      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();
      // API returns { success: true, data: { users: [...], total: ..., page: ..., pageSize: ... } }
      // Extract the data field
      if (result.success && result.data) {
        return result.data;
      }
      // Fallback for backward compatibility
      return result;
    },
  });
}

// Fetch single user
export function useUser(userId: string) {
  return useQuery<User>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const result = await response.json();
      // API returns { success: true, data: { user: {...} } }
      // Extract the data.user field
      if (result.success && result.data?.user) {
        return result.data.user;
      }
      // Fallback for backward compatibility
      return result;
    },
    enabled: !!userId,
  });
}

// Create user
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UserFormData) => {
      const formData = new FormData();
      
      // Personal info
      if (data.personal.profilePicture) {
        formData.append('profilePicture', data.personal.profilePicture);
      }
      formData.append('fullName', data.personal.fullName);
      formData.append('email', data.personal.email);
      if (data.personal.phone) formData.append('phone', data.personal.phone);
      if (data.personal.password) formData.append('password', data.personal.password);

      // Work info
      formData.append('role', data.work.role);
      if (data.work.department) formData.append('department', data.work.department);
      if (data.work.position) formData.append('position', data.work.position);
      if (data.work.employeeId) formData.append('employeeId', data.work.employeeId);
      if (data.work.hireDate) formData.append('hireDate', data.work.hireDate.toISOString());
      if (data.work.manager) formData.append('manager', data.work.manager);
      if (data.work.agencyIds) {
        data.work.agencyIds.forEach(id => formData.append('agencyIds[]', id));
      }

      // Contact info
      if (data.contact) {
        if (data.contact.address) formData.append('address', data.contact.address);
        if (data.contact.city) formData.append('city', data.contact.city);
        if (data.contact.country) formData.append('country', data.contact.country);
        if (data.contact.postalCode) formData.append('postalCode', data.contact.postalCode);
        if (data.contact.emergencyContact) formData.append('emergencyContact', data.contact.emergencyContact);
        if (data.contact.emergencyPhone) formData.append('emergencyPhone', data.contact.emergencyPhone);
      }

      // Documents
      if (data.documents) {
        if (data.documents.passport) formData.append('passport', data.documents.passport);
        if (data.documents.idCard) formData.append('idCard', data.documents.idCard);
        if (data.documents.contract) formData.append('contract', data.documents.contract);
        if (data.documents.otherDocuments) {
          data.documents.otherDocuments.forEach((file, index) => {
            formData.append(`otherDocuments[${index}]`, file);
          });
        }
      }

      // CV
      if (data.cv?.cv) formData.append('cv', data.cv.cv);

      // Preferences
      if (data.preferences) {
        formData.append('defaultLanguage', data.preferences.defaultLanguage);
        formData.append('defaultTheme', data.preferences.defaultTheme);
        formData.append('defaultLayout', data.preferences.defaultLayout);
      }

      const response = await fetch(API_BASE, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<UserFormData> }) => {
      // Check if profile picture file exists - if so, use FormData
      const hasProfilePicture = data.personal?.profilePicture instanceof File;
      
      if (hasProfilePicture) {
        // Use FormData for file upload
        const formData = new FormData();
        
        // Add profile picture file
        if (data.personal?.profilePicture) {
          formData.append('profilePicture', data.personal.profilePicture);
        }
        
        // Add other fields as JSON string for nested structure
        const jsonData = { ...data };
        // Remove file from JSON data
        if (jsonData.personal) {
          delete jsonData.personal.profilePicture;
        }
        formData.append('data', JSON.stringify(jsonData));
        
        const response = await fetch(`${API_BASE}/${userId}`, {
          method: 'PATCH',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Failed to update user');
        }

        return response.json();
      } else {
        // Send as JSON - no file upload
        const response = await fetch(`${API_BASE}/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Failed to update user');
        }

        return response.json();
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    },
  });
}

// Delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_BASE}/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Activate/Deactivate user
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) => {
      const response = await fetch(`${API_BASE}/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}




