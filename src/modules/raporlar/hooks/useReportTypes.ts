'use client';

import { useState, useEffect } from 'react';
import { reportService } from '../services/report.service';
import { reportTypeRegistry } from '@/lib/reports/ReportTypeRegistry';
import type { ReportType } from '../types/report';

export function useReportTypes() {
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get core types from service
        const coreTypes = await reportService.getReportTypes();
        
        // Get module types from registry
        const moduleTypes = reportTypeRegistry.getByCategory('module');
        
        // Combine all types
        const allTypes = [...coreTypes, ...moduleTypes];
        setReportTypes(allTypes);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch report types'));
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
    
    // Listen for registry changes
    const interval = setInterval(() => {
      const moduleTypes = reportTypeRegistry.getByCategory('module');
      setReportTypes(prev => {
        const coreTypes = prev.filter(t => t.category === 'core');
        return [...coreTypes, ...moduleTypes];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getReportType = (id: string): ReportType | undefined => {
    return reportTypes.find(t => t.id === id);
  };

  const getCoreTypes = (): ReportType[] => {
    return reportTypes.filter(t => t.category === 'core');
  };

  const getModuleTypes = (): ReportType[] => {
    return reportTypes.filter(t => t.category === 'module');
  };

  return {
    reportTypes,
    loading,
    error,
    getReportType,
    getCoreTypes,
    getModuleTypes,
  };
}
