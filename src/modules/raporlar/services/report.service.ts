import type { Report, ReportType, ReportCreateData } from '../types/report';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

const API_BASE = '/api/reports';

// Transform API report to frontend Report type
function transformReport(apiReport: any): Report {
  return {
    id: apiReport.id,
    name: apiReport.name,
    type: apiReport.reportType,
    typeName: apiReport.reportType, // Will be enhanced with report types lookup
    status: apiReport.status,
    createdAt: apiReport.createdAt,
    createdBy: apiReport.userId,
    createdByName: apiReport.user?.name || apiReport.user?.email || 'Unknown',
    filters: apiReport.filters || {},
    dateRange: apiReport.dateRange || undefined,
    ...(apiReport.outputUrl ? { fileSize: 'N/A' } : {}),
    generatedAt: apiReport.completedAt || undefined,
  };
}

export const reportService = {
  // Get all reports
  async getReports(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    reportType?: string;
    status?: string;
    userId?: string;
    companyId?: string;
  }): Promise<{ reports: Report[]; total: number; page: number; pageSize: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.reportType) searchParams.set('reportType', params.reportType);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.companyId) searchParams.set('companyId', params.companyId);

    const response = await authenticatedFetch(`${API_BASE}?${searchParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch reports');
    }

    const result = await response.json();
    if (result.success && result.data) {
      return {
        reports: result.data.reports.map(transformReport),
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize,
      };
    }

    throw new Error('Invalid API response format');
  },

  // Get report by ID
  async getReport(id: string): Promise<Report | null> {
    const response = await authenticatedFetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch report');
    }

    const result = await response.json();
    if (result.success && result.data) {
      return transformReport(result.data.report);
    }

    throw new Error('Invalid API response format');
  },

  // Create new report
  async createReport(data: ReportCreateData): Promise<Report> {
    const response = await authenticatedFetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to create report');
    }

    const result = await response.json();
    if (result.success && result.data) {
      return transformReport(result.data.report);
    }

    throw new Error('Invalid API response format');
  },

  // Delete report
  async deleteReport(id: string): Promise<void> {
    const response = await authenticatedFetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to delete report');
    }
  },

  // Get report types (still using mock for now - can be enhanced with API later)
  async getReportTypes(): Promise<ReportType[]> {
    // TODO: Create API endpoint for report types
    // For now, return static types
    return [
      {
        id: 'user_activity',
        name: 'Kullanıcı Aktivitesi',
        category: 'core',
        icon: 'IconUsers',
        description: 'Kullanıcı aktivite ve etkileşim raporu',
        filters: [
          {
            key: 'userId',
            label: 'Kullanıcı',
            type: 'select',
            required: false,
          },
          {
            key: 'actionType',
            label: 'Aksiyon Tipi',
            type: 'multiselect',
            options: [
              { value: 'login', label: 'Giriş' },
              { value: 'logout', label: 'Çıkış' },
              { value: 'create', label: 'Oluşturma' },
              { value: 'update', label: 'Güncelleme' },
              { value: 'delete', label: 'Silme' },
            ],
          },
        ],
        visualization: {
          type: 'table',
        },
      },
      {
        id: 'system_stats',
        name: 'Sistem İstatistikleri',
        category: 'core',
        icon: 'IconActivity',
        description: 'Sistem performans ve kullanım istatistikleri',
        filters: [
          {
            key: 'metric',
            label: 'Metrik',
            type: 'multiselect',
            options: [
              { value: 'cpu', label: 'CPU Kullanımı' },
              { value: 'memory', label: 'Bellek Kullanımı' },
              { value: 'storage', label: 'Depolama' },
              { value: 'requests', label: 'İstek Sayısı' },
            ],
          },
        ],
        visualization: {
          type: 'line',
        },
      },
      {
        id: 'login_history',
        name: 'Giriş Geçmişi',
        category: 'core',
        icon: 'IconCalendar',
        description: 'Kullanıcı giriş geçmişi raporu',
        filters: [
          {
            key: 'userId',
            label: 'Kullanıcı',
            type: 'select',
            required: false,
          },
          {
            key: 'status',
            label: 'Durum',
            type: 'select',
            options: [
              { value: 'success', label: 'Başarılı' },
              { value: 'failed', label: 'Başarısız' },
            ],
          },
        ],
        visualization: {
          type: 'table',
        },
      },
      {
        id: 'api_usage',
        name: 'API Kullanımı',
        category: 'core',
        icon: 'IconTrendingUp',
        description: 'API kullanım istatistikleri',
        filters: [
          {
            key: 'endpoint',
            label: 'Endpoint',
            type: 'select',
            required: false,
          },
        ],
        visualization: {
          type: 'bar',
        },
      },
    ];
  },

  // Get report data (for export)
  async getReportData(id: string): Promise<any> {
    const report = await this.getReport(id);
    if (!report) {
      throw new Error('Report not found');
    }
    
    // TODO: Create API endpoint for report data generation
    // For now, return mock data structure
    const columns = ['Tarih', 'Kullanıcı', 'Aksiyon', 'Detay', 'Durum'];
    const rows = Array.from({ length: 50 }, (_, i) => [
      new Date(Date.now() - i * 86400000).toLocaleDateString('tr-TR'),
      `User ${Math.floor(Math.random() * 10) + 1}`,
      ['Giriş', 'Çıkış', 'Oluşturma', 'Güncelleme', 'Silme'][Math.floor(Math.random() * 5)],
      `Detay ${i + 1}`,
      ['Başarılı', 'Başarısız'][Math.floor(Math.random() * 2)],
    ]);
    
    return {
      columns,
      rows,
      metadata: {
        title: report.name,
        description: `Rapor ID: ${report.id}`,
        generatedAt: report.generatedAt || report.createdAt,
        generatedBy: report.createdByName || report.createdBy,
      },
    };
  },
};


