'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../services/report.service';
import type { ReportCreateData } from '../types/report';

export interface ReportQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  reportType?: string;
  status?: string;
  userId?: string;
  companyId?: string;
}

// Fetch reports list
export function useReports(params?: ReportQueryParams) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      return await reportService.getReports(params);
    },
  });
}

// Fetch single report
export function useReport(id: string | null) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!id) return null;
      return await reportService.getReport(id);
    },
    enabled: !!id,
  });
}

// Create report
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReportCreateData) => {
      return await reportService.createReport(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// Delete report
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await reportService.deleteReport(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}


