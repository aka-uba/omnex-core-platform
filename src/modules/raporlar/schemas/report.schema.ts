import { z } from 'zod';

export const reportCreateSchema = z.object({
  name: z.string().min(1, 'Rapor adı gereklidir').max(255, 'Rapor adı çok uzun'),
  type: z.string().min(1, 'Rapor tipi seçilmelidir'),
  description: z.string().optional(),
  dateRange: z.object({
    from: z.string().min(1, 'Başlangıç tarihi gereklidir'),
    to: z.string().min(1, 'Bitiş tarihi gereklidir'),
  }),
  filters: z.record(z.string(), z.any()).optional(),
  visualization: z.object({
    type: z.enum(['table', 'bar', 'line', 'pie', 'area']),
    options: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export type ReportCreateFormData = z.infer<typeof reportCreateSchema>;

