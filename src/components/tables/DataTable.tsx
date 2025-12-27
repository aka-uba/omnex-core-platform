'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  TextInput,
  Group,
  Text,
  Pagination,
  Select,
  ActionIcon,
  Paper,
  Stack,
  Button,
  Badge,
  Card,
  Box,
  Checkbox,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconSearch, IconChevronUp, IconChevronDown, IconArrowsSort, IconFilter, IconDotsVertical, IconFile, IconFileSpreadsheet, IconFileText, IconCode, IconPrinter, IconLayout } from '@tabler/icons-react';
import classes from './DataTable.module.css';
import { FilterModal, FilterOption } from './FilterModal';
import { ColumnSettingsModal, ColumnSettingsColumn, TableStyleSettings } from './ColumnSettingsModal';
import { useExport } from '@/lib/export/ExportProvider';
import { useTranslation } from '@/lib/i18n/client';

export type { FilterOption } from './FilterModal';
export type { TableStyleSettings } from './ColumnSettingsModal';

// Utility function to calculate contrast color (black or white) based on background
function getContrastColor(hexColor: string | undefined): string | undefined {
  if (!hexColor) return undefined;

  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  let r: number, g: number, b: number;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return undefined;
  }

  // Calculate relative luminance using sRGB
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Utility function to calculate hover color (slightly darker or lighter)
function getHoverColor(hexColor: string | undefined): string | undefined {
  if (!hexColor) return undefined;

  const hex = hexColor.replace('#', '');

  let r: number, g: number, b: number;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return undefined;
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Darken light colors, lighten dark colors
  const factor = luminance > 0.5 ? 0.9 : 1.15;

  r = Math.min(255, Math.max(0, Math.round(r * factor)));
  g = Math.min(255, Math.max(0, Math.round(g * factor)));
  b = Math.min(255, Math.max(0, Math.round(b * factor)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  align?: 'left' | 'right' | 'center';
  backgroundColor?: string; // Column background color
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  data: any[];
  searchable?: boolean;
  sortable?: boolean;
  pageable?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  filters?: FilterOption[];
  onFilter?: (filters: Record<string, any>) => void;
  showColumnSettings?: boolean;
  onColumnReorder?: (columns: DataTableColumn[]) => void;
  onColumnToggle?: (columnKey: string, visible: boolean) => void;
  onExport?: (format: 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html') => void;
  showExportIcons?: boolean;
  exportTemplateId?: string; // Template ID for export styling
  exportScope?: 'all' | 'current-page' | 'selected'; // Export scope: all data, current page, or selected rows
  exportTitle?: string; // Title for export files
  exportNamespace?: string; // Translation namespace for export labels
  // Selection props
  selectable?: boolean; // Enable row selection
  selectedRows?: string[]; // Currently selected row IDs
  onSelectionChange?: (selectedIds: string[]) => void; // Callback when selection changes
  rowIdKey?: string; // Key to use for row ID (default: 'id')
  // Row number column
  showRowNumbers?: boolean; // Show row number (#) column (default: true)
  // Persistence
  tableId?: string; // Unique ID for persisting column settings to localStorage
}

export function DataTable({
  columns,
  data,
  searchable = true,
  sortable = true,
  pageable = true,
  defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  emptyMessage,
  onRowClick,
  filters = [],
  onFilter,
  showColumnSettings = true,
  onColumnReorder,
  onColumnToggle,
  onExport,
  showExportIcons = false,
  exportTemplateId,
  exportScope = 'all', // Default: export all data
  exportTitle,
  exportNamespace = 'global',
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowIdKey = 'id',
  showRowNumbers = true,
  tableId,
}: DataTableProps) {
  const { t } = useTranslation(exportNamespace);
  const { t: tGlobal } = useTranslation('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showColumnSettingsModal, setShowColumnSettingsModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [visibleColumns, setVisibleColumns] = useState<DataTableColumn[]>(() => {
    // Try to load saved column settings from localStorage
    if (tableId && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`datatable-columns-${tableId}`);
        if (saved) {
          const savedSettings = JSON.parse(saved) as Array<{ key: string; hidden?: boolean; backgroundColor?: string; order: number }>;
          // Merge saved settings with current columns
          const merged = columns.map(col => {
            const savedCol = savedSettings.find(s => s.key === col.key);
            if (savedCol) {
              return { ...col, hidden: savedCol.hidden, backgroundColor: savedCol.backgroundColor };
            }
            return col;
          });
          // Sort by saved order
          merged.sort((a, b) => {
            const aOrder = savedSettings.find(s => s.key === a.key)?.order ?? 999;
            const bOrder = savedSettings.find(s => s.key === b.key)?.order ?? 999;
            return aOrder - bOrder;
          });
          return merged;
        }
      } catch (e) {
        console.warn('Failed to load column settings from localStorage:', e);
      }
    }
    return columns;
  });
  const [columnsInitialized, setColumnsInitialized] = useState(false);

  // Table style settings state
  const [styleSettings, setStyleSettings] = useState<TableStyleSettings>(() => {
    // Try to load saved style settings from localStorage
    if (tableId && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`datatable-style-${tableId}`);
        if (saved) {
          return JSON.parse(saved) as TableStyleSettings;
        }
      } catch (e) {
        console.warn('Failed to load style settings from localStorage:', e);
      }
    }
    return {
      showVerticalBorders: false,
      headerBackgroundColor: '',
    };
  });

  // Mobile detection for card view
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Selection helpers
  const isAllSelected = useMemo(() => {
    if (!selectable || data.length === 0) return false;
    return data.every(row => selectedRows.includes(row[rowIdKey]));
  }, [selectable, data, selectedRows, rowIdKey]);

  const isIndeterminate = useMemo(() => {
    if (!selectable || data.length === 0) return false;
    const selectedCount = data.filter(row => selectedRows.includes(row[rowIdKey])).length;
    return selectedCount > 0 && selectedCount < data.length;
  }, [selectable, data, selectedRows, rowIdKey]);

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      // Deselect all current page rows
      const currentPageIds = data.map(row => row[rowIdKey]);
      onSelectionChange(selectedRows.filter(id => !currentPageIds.includes(id)));
    } else {
      // Select all current page rows
      const currentPageIds = data.map(row => row[rowIdKey]);
      const newSelection = [...new Set([...selectedRows, ...currentPageIds])];
      onSelectionChange(newSelection);
    }
  }, [data, isAllSelected, onSelectionChange, rowIdKey, selectedRows]);

  const handleSelectRow = useCallback((rowId: string) => {
    if (!onSelectionChange) return;
    if (selectedRows.includes(rowId)) {
      onSelectionChange(selectedRows.filter(id => id !== rowId));
    } else {
      onSelectionChange([...selectedRows, rowId]);
    }
  }, [onSelectionChange, selectedRows]);

  // Update visible columns when columns prop changes (only if structure changed, not just reference)
  useEffect(() => {
    // Skip if already initialized from localStorage
    if (columnsInitialized) return;

    // Only update if the keys are different (new columns added/removed)
    // Don't reset if user has made customizations
    if (visibleColumns.length === 0 || columns.length === 0) {
      setVisibleColumns(columns);
      setColumnsInitialized(true);
      return;
    }
    const currentKeys = visibleColumns.map(c => c.key).sort().join(',');
    const newKeys = columns.map(c => c.key).sort().join(',');
    // Only update if columns were actually added or removed
    if (currentKeys !== newKeys) {
      // Merge existing customizations with new columns
      const merged = columns.map(col => {
        const existing = visibleColumns.find(vc => vc.key === col.key);
        return existing ? { ...col, ...existing } : col;
      });
      setVisibleColumns(merged);
    }
    setColumnsInitialized(true);
  }, [columns, columnsInitialized]);

  // Save column settings to localStorage when they change
  useEffect(() => {
    if (!tableId || !columnsInitialized) return;
    try {
      const settings = visibleColumns.map((col, index) => ({
        key: col.key,
        hidden: col.hidden,
        backgroundColor: col.backgroundColor,
        order: index,
      }));
      localStorage.setItem(`datatable-columns-${tableId}`, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save column settings to localStorage:', e);
    }
  }, [visibleColumns, tableId, columnsInitialized]);

  // Save style settings to localStorage when they change
  useEffect(() => {
    if (!tableId || !columnsInitialized) return;
    try {
      localStorage.setItem(`datatable-style-${tableId}`, JSON.stringify(styleSettings));
    } catch (e) {
      console.warn('Failed to save style settings to localStorage:', e);
    }
  }, [styleSettings, tableId, columnsInitialized]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply active filters
    if (onFilter && Object.keys(activeFilters).length > 0) {
      result = result.filter((row) => {
        return Object.entries(activeFilters).every(([key, value]) => {
          if (!value || value === '') return true;
          const rowValue = row[key];
          if (key.endsWith('_start') || key.endsWith('_end')) {
            // Date range filter
            const baseKey = key.replace(/_start$|_end$/, '');
            const startValue = activeFilters[`${baseKey}_start`];
            const endValue = activeFilters[`${baseKey}_end`];
            if (!startValue && !endValue) return true;
            const rowDate = new Date(row[baseKey]).getTime();
            if (startValue && rowDate < new Date(startValue).getTime()) return false;
            if (endValue && rowDate > new Date(endValue).getTime()) return false;
            return true;
          }
          return String(rowValue ?? '').toLowerCase().includes(String(value).toLowerCase());
        });
      });
    }

    // Apply search
    if (searchQuery) {
      result = result.filter((row) =>
        visibleColumns.some((column) => {
          if (!column.searchable && column.searchable !== undefined) return false;
          const value = (row as Record<string, any>)[column.key];
          return String(value ?? '').toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (sortColumn && sortable) {
      result.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Compare values
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection, visibleColumns, sortable, activeFilters, onFilter]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize);
  const startRecord = processedData.length > 0 ? startIndex + 1 : 0;
  const endRecord = Math.min(startIndex + pageSize, processedData.length);

  // Handle sort - cycle through: none -> asc -> desc -> none
  const handleSort = useCallback((columnKey: string) => {
    if (!sortable) return;

    const column = columns.find((col) => col.key === columnKey);
    if (column && column.sortable === false) return;

    setSortColumn((prevSortColumn) => {
      if (prevSortColumn === columnKey) {
        // Same column clicked - toggle direction
        setSortDirection((prevDirection) => {
          if (prevDirection === 'asc') {
            return 'desc';
          } else {
            // Reset to no sort
            setSortColumn(null);
            return 'asc';
          }
        });
        return prevSortColumn;
      } else {
        // New column clicked - set to ascending
        setSortDirection('asc');
        return columnKey;
      }
    });
    setCurrentPage(1);
  }, [sortable, columns]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((size: string | null) => {
    setPageSize(Number(size));
    setCurrentPage(1);
  }, []);

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <IconArrowsSort size={16} className="text-text-secondary-light dark:text-text-secondary-dark" />;
    }
    return sortDirection === 'asc' ? (
      <IconChevronUp size={16} className="text-primary" />
    ) : (
      <IconChevronDown size={16} className="text-primary" />
    );
  };

  // Handle filter
  const handleFilter = useCallback((filters: Record<string, any>) => {
    setActiveFilters(filters);
    onFilter?.(filters);
    setCurrentPage(1);
  }, [onFilter]);

  const handleFilterClear = useCallback(() => {
    setActiveFilters({});
    onFilter?.({});
    setCurrentPage(1);
  }, [onFilter]);

  // Handle column reorder
  const handleColumnReorder = useCallback((newColumns: ColumnSettingsColumn[]) => {
    const mappedColumns: DataTableColumn[] = newColumns.map((col) => {
      const original = columns.find((c) => c.key === col.key);
      return { ...original, ...col } as DataTableColumn;
    });
    setVisibleColumns(mappedColumns);
    onColumnReorder?.(mappedColumns);
  }, [columns, onColumnReorder]);

  // Handle column toggle
  const handleColumnToggle = useCallback((columnKey: string, visible: boolean) => {
    setVisibleColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.key === columnKey ? { ...col, hidden: !visible } : col
      )
    );
    onColumnToggle?.(columnKey, visible);
  }, [onColumnToggle]);

  // Handle style settings change
  const handleStyleSettingsChange = useCallback((newSettings: TableStyleSettings) => {
    setStyleSettings(newSettings);
  }, []);

  // Get visible columns
  const displayColumns = visibleColumns.filter((col) => !col.hidden);

  // Export hook (if available)
  let exportHook: ReturnType<typeof useExport> | null = null;
  try {
    exportHook = useExport();
  } catch (error) {
    // ExportProvider not available, use onExport callback
  }

  // Helper function to convert React node to string for export
  // Convert React node to HTML string for export - memoized to avoid recreating on every render
  const nodeToHTML = useCallback((node: React.ReactNode): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (typeof node === 'boolean') return node ? 'Yes' : 'No';
    if (Array.isArray(node)) return node.map(nodeToHTML).join(' ');
    
    if (typeof node === 'object' && 'props' in node) {
      const props = (node.props || {}) as any;
      const type = node.type as any;
      const typeName = (type?.displayName || type?.name || '') as string;
      
      // Badge component - render as colored span
      if (typeName === 'Badge' || props.color || (props.children && typeof props.children === 'object' && 'props' in props.children && (props.children as any).props?.color)) {
        const color = props.color || (props.children && typeof props.children === 'object' && 'props' in props.children ? (props.children as any).props?.color : null) || 'gray';
        const text = nodeToHTML(props.children);
        const colorMap: Record<string, string> = {
          blue: '#228be6',
          green: '#51cf66',
          red: '#fa5252',
          yellow: '#fab005',
          orange: '#fd7e14',
          purple: '#9775fa',
          cyan: '#3bc9db',
          gray: '#868e96',
        };
        const bgColor = colorMap[color] || colorMap.gray;
        return `<span style="display: inline-block; padding: 2px 8px; background-color: ${bgColor}; color: white; border-radius: 4px; font-size: 12px; font-weight: 500;">${text}</span>`;
      }
      
      // Mantine Badge - check for color in variant or className
      if (typeName?.includes('Badge') || props.variant) {
        const text = nodeToHTML(props.children);
        const color = props.color || 'gray';
        const colorMap: Record<string, string> = {
          blue: '#228be6',
          green: '#51cf66',
          red: '#fa5252',
          yellow: '#fab005',
          orange: '#fd7e14',
          purple: '#9775fa',
          cyan: '#3bc9db',
          gray: '#868e96',
        };
        const bgColor = colorMap[color] || colorMap.gray;
        return `<span style="display: inline-block; padding: 2px 8px; background-color: ${bgColor}; color: white; border-radius: 4px; font-size: 12px; font-weight: 500;">${text}</span>`;
      }
      
      // ActionIcon or Icon - extract icon name or use placeholder
      if (typeName?.includes('Icon') || props['data-icon']) {
        const iconName = props['data-icon'] || typeName || 'icon';
        return `<span style="display: inline-block; width: 16px; height: 16px; vertical-align: middle;">[${iconName}]</span>`;
      }
      
      // Group component - render children inline
      if (typeName === 'Group' || props.gap !== undefined) {
        return nodeToHTML(props.children);
      }
      
      // Avatar or Image - render as img tag
      if (typeName === 'Avatar' || typeName === 'Image' || props.src) {
        const src = props.src || '';
        const alt = props.alt || '';
        if (src) {
          return `<img src="${src}" alt="${alt}" style="max-width: 40px; max-height: 40px; border-radius: 4px;" />`;
        }
        return alt || '[Image]';
      }
      
      // HoverCard - only extract Target content, ignore Dropdown
      if (typeName === 'HoverCard' || props.openDelay !== undefined) {
        // HoverCard has Target and Dropdown children
        // We only want Target content for export
        if (props.children) {
          if (Array.isArray(props.children)) {
            // Find Target child (usually first one)
            const targetChild = props.children.find((child: any) => {
              const childType = ((child?.type as any)?.displayName || (child?.type as any)?.name || '') as string;
              return childType === 'Target' || childType?.includes('Target');
            });
            if (targetChild) {
              return nodeToHTML(targetChild);
            }
            // If no Target found, use first child (usually Target)
            if (props.children.length > 0) {
              return nodeToHTML(props.children[0]);
            }
          } else {
            // Single child - check if it's Target
            const child = props.children;
            const childType = ((child?.type as any)?.displayName || (child?.type as any)?.name || '') as string;
            if (childType === 'Target' || childType?.includes('Target')) {
              return nodeToHTML(child);
            }
            // If not Target, try to extract children
            if (child?.props?.children) {
              return nodeToHTML(child.props.children);
            }
          }
        }
        // Fallback: return empty
        return '';
      }
      
      // HoverCard Target - extract children (skip Dropdown)
      if (typeName === 'Target' || typeName?.includes('Target')) {
        return nodeToHTML(props.children);
      }
      
      // HoverCard Dropdown - skip in export
      if (typeName === 'Dropdown' || typeName?.includes('Dropdown')) {
        return '';
      }
      
      // Tooltip - extract children
      if (typeName === 'Tooltip' || props.label) {
        return nodeToHTML(props.children);
      }
      
      // Text component - extract text
      if (typeName === 'Text' || props.size) {
        return nodeToHTML(props.children);
      }
      
      // Default: try to extract children
      if (props.children) {
        return nodeToHTML(props.children);
      }
    }
    
    return String(node);
  }, []);

  // Fallback to simple string conversion for non-HTML exports - memoized
  const nodeToString = useCallback((node: React.ReactNode): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (typeof node === 'boolean') return node ? 'Yes' : 'No';
    if (Array.isArray(node)) return node.map(nodeToString).join(' ');
    if (typeof node === 'object' && 'props' in node) {
      const props = (node.props || {}) as any;
      // React element - try to extract text content
      if (props.children) {
        return nodeToString(props.children);
      }
      // For Badge components, try to get the text
      if ((node.type as any)?.displayName === 'Badge' || props.children) {
        return nodeToString(props.children);
      }
    }
    return String(node);
  }, []);

  // Export handler
  const handleExport = async (format: 'csv' | 'excel' | 'word' | 'pdf' | 'print' | 'html') => {
    if (onExport) {
      // Use custom export handler if provided
      onExport(format);
      return;
    }

    if (!exportHook) {
      console.warn('ExportProvider not available and no onExport handler provided');
      return;
    }

    // Prepare export data based on export scope
    // Use ALL columns (not just visible ones) for export, but exclude hidden ones and actions column
    const exportColumns = columns.filter(col => !col.hidden && col.key !== 'actions');
    
    let dataToExport = processedData;
    if (exportScope === 'current-page') {
      // Export only current page
      const startIndex = (currentPage - 1) * pageSize;
      dataToExport = processedData.slice(startIndex, startIndex + pageSize);
    } else if (exportScope === 'selected') {
      // Export only selected rows (if selection is implemented)
      // For now, fallback to current page
      const startIndex = (currentPage - 1) * pageSize;
      dataToExport = processedData.slice(startIndex, startIndex + pageSize);
    }
    // else: exportScope === 'all' - export all processed data

    // Calculate column alignments: first column left, last column (actions) right, middle columns center
    const columnAlignments = exportColumns.map((col, index) => {
      const isFirstColumn = index === 0;
      const isLastColumn = index === exportColumns.length - 1;
      const isActionsColumn = col.key === 'actions';
      
      if (isActionsColumn) {
        return col.align || 'right';
      } else if (isFirstColumn) {
        return 'left';
      } else if (isLastColumn) {
        return 'right';
      } else {
        return 'center';
      }
    });

    const exportData = {
      columns: exportColumns.map(col => col.label),
      columnAlignments: columnAlignments, // Sütun hizalamaları
      rows: dataToExport.map(row => 
        exportColumns.map(col => {
          const value = (row as Record<string, any>)[col.key];
          // If column has render function, use it to get formatted value
          if (col.render) {
            try {
              const rendered = col.render(value, row);
              // Return object with both HTML and text versions for different export formats
              return {
                html: nodeToHTML(rendered),
                text: nodeToString(rendered),
                raw: rendered, // Keep raw for advanced processing
              };
            } catch (error) {
              console.warn(`Error rendering column ${col.key}:`, error);
              return { html: String(value ?? ''), text: String(value ?? ''), raw: value };
            }
          }
          // Otherwise use raw value
          return { html: String(value ?? ''), text: String(value ?? ''), raw: value };
        })
      ),
      metadata: {
        title: exportTitle || tGlobal('export.report'),
        generatedAt: new Date().toISOString(),
        scope: exportScope,
        totalRecords: processedData.length,
        exportedRecords: dataToExport.length,
        currentPage: exportScope === 'current-page' ? currentPage : undefined,
        pageSize: exportScope === 'current-page' ? pageSize : undefined,
      },
    };

    // Export options with template
    const exportOptions: any = {
      format,
      templateId: exportTemplateId,
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      title: exportTitle || tGlobal('export.report'),
    };

    try {
      switch (format) {
        case 'csv':
          await exportHook.exportToCSV(exportData, exportOptions);
          break;
        case 'excel':
          await exportHook.exportToExcel(exportData, exportOptions);
          break;
        case 'word':
          await exportHook.exportToWord(exportData, exportOptions);
          break;
        case 'pdf':
          await exportHook.exportToPDF(exportData, exportOptions);
          break;
        case 'html':
          await exportHook.exportToHTML(exportData, exportOptions);
          break;
        case 'print':
          await exportHook.printData(exportData, exportOptions);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Export options with translations
  const exportOptions = [
    { value: 'pdf' as const, label: tGlobal('export.pdf'), icon: IconFile, color: 'red' },
    { value: 'excel' as const, label: tGlobal('export.excel'), icon: IconFileSpreadsheet, color: 'green' },
    { value: 'csv' as const, label: tGlobal('export.csv'), icon: IconFileText, color: 'blue' },
    { value: 'word' as const, label: tGlobal('export.word'), icon: IconFileText, color: 'blue' },
    { value: 'html' as const, label: tGlobal('export.html'), icon: IconCode, color: 'orange' },
    { value: 'print' as const, label: tGlobal('export.print') || t('export.print'), icon: IconPrinter, color: 'gray' },
  ];

  return (
    <Paper shadow="sm" p="md" radius="md" {...(classes.tableContainer ? { className: classes.tableContainer } : {})}>
      <Stack gap="md">
        {/* Toolbar */}
        {searchable && (
          <Stack gap="sm" mb="md" {...(classes.toolbar ? { className: classes.toolbar } : {})}>
            {/* First Row: Search + Filter + Export Icons (mobile: stacked, desktop: inline) */}
            <Group justify="space-between" wrap={isMobile ? 'wrap' : 'nowrap'} gap="sm" style={{ width: '100%' }}>
              <TextInput
                placeholder={tGlobal('table.search.placeholder')}
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.currentTarget.value);
                  setCurrentPage(1);
                }}
                {...(classes.searchInput ? { className: classes.searchInput } : {})}
                style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}
              />
              {/* Export Icons, Filter & Column Settings - Desktop only, right aligned */}
              {!isMobile && (
                <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                  {/* Export Icons - Left side (before filter button) */}
                  {showExportIcons && (
                    <>
                      {exportOptions.map((option) => {
                        const Icon = option.icon;
                        const isDisabled = !onExport && !exportHook;
                        return (
                          <ActionIcon
                            key={option.value}
                            variant={isDisabled ? "transparent" : "subtle"}
                            color={isDisabled ? "gray" : option.color}
                            size="lg"
                            onClick={() => !isDisabled && handleExport(option.value)}
                            title={isDisabled ? tGlobal('table.export.providerRequired') : `${option.label} (${exportScope === 'all' ? tGlobal('table.export.all') : exportScope === 'current-page' ? tGlobal('table.export.currentPage') : tGlobal('table.export.selected')})`}
                            style={{ flexShrink: 0, opacity: isDisabled ? 0.5 : 1 }}
                            disabled={isDisabled}
                          >
                            <Icon size={18} />
                          </ActionIcon>
                        );
                      })}
                    </>
                  )}
                  {/* Filter button - Right side */}
                  {filters.length > 0 && (
                    <Button
                      variant="default"
                      leftSection={<IconFilter size={16} />}
                      rightSection={<IconDotsVertical size={16} />}
                      onClick={() => setShowFilterModal(true)}
                      size="sm"
                      style={{ flexShrink: 0 }}
                    >
                      {tGlobal('table.filter.button')}
                      {Object.keys(activeFilters).length > 0 && (
                        <Badge size="xs" color="blue" variant="filled" ml="xs">
                          {Object.keys(activeFilters).length}
                        </Badge>
                      )}
                    </Button>
                  )}
                  {/* Column Settings - Right side */}
                  {showColumnSettings && (
                    <ActionIcon
                      variant="default"
                      size="lg"
                      onClick={() => setShowColumnSettingsModal(true)}
                      title={tGlobal('table.columnSettings.title')}
                      style={{ flexShrink: 0 }}
                    >
                      <IconLayout size={20} />
                    </ActionIcon>
                  )}
                </Group>
              )}
            </Group>

            {/* Mobile: Second Row - Export Icons */}
            {isMobile && showExportIcons && (
              <Group gap="xs" justify="center" wrap="wrap">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  const isDisabled = !onExport && !exportHook;
                  return (
                    <ActionIcon
                      key={option.value}
                      variant={isDisabled ? "transparent" : "subtle"}
                      color={isDisabled ? "gray" : option.color}
                      size="lg"
                      onClick={() => !isDisabled && handleExport(option.value)}
                      title={isDisabled ? tGlobal('table.export.providerRequired') : `${option.label}`}
                      style={{ opacity: isDisabled ? 0.5 : 1 }}
                      disabled={isDisabled}
                    >
                      <Icon size={18} />
                    </ActionIcon>
                  );
                })}
              </Group>
            )}

            {/* Mobile: Third Row - Filter & Column Settings */}
            {isMobile && (filters.length > 0 || showColumnSettings) && (
              <Group gap="xs" justify="flex-end" wrap="nowrap">
                {filters.length > 0 && (
                  <Button
                    variant="default"
                    leftSection={<IconFilter size={16} />}
                    onClick={() => setShowFilterModal(true)}
                    size="sm"
                    style={{ flex: 1 }}
                  >
                    {tGlobal('table.filter.button')}
                    {Object.keys(activeFilters).length > 0 && (
                      <Badge size="xs" color="blue" variant="filled" ml="xs">
                        {Object.keys(activeFilters).length}
                      </Badge>
                    )}
                  </Button>
                )}
                {showColumnSettings && (
                  <ActionIcon
                    variant="default"
                    size="lg"
                    onClick={() => setShowColumnSettingsModal(true)}
                    title={tGlobal('table.columnSettings.title')}
                  >
                    <IconLayout size={20} />
                  </ActionIcon>
                )}
              </Group>
            )}
          </Stack>
        )}

        {/* Mobile Card View */}
        {isMobile ? (
          <div className={classes.cardContainer}>
            {paginatedData.length === 0 ? (
              <Card withBorder p="xl" className={classes.emptyCard}>
                <Text c="dimmed" ta="center">{emptyMessage || tGlobal('empty.message')}</Text>
              </Card>
            ) : (
              paginatedData.map((row, rowIndex) => {
                // İlk sütunu (genellikle başlık/isim) card header olarak kullan
                const firstColumn = displayColumns.find(col => col.key !== 'actions');
                // Actions sütununu card footer olarak ayır
                const actionsColumn = displayColumns.find(col => col.key === 'actions');
                // Diğer sütunları card body olarak kullan
                const bodyColumns = displayColumns.filter(col => col.key !== 'actions' && col !== firstColumn);

                return (
                  <Card
                    key={rowIndex}
                    withBorder
                    shadow="sm"
                    radius="md"
                    className={classes.dataCard}
                    onClick={() => onRowClick?.(row)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {/* Card Header - İlk sütun (başlık) */}
                    {firstColumn && (
                      <Box className={classes.cardHeader}>
                        <Text component="div" fw={600} size="md" lineClamp={2}>
                          {firstColumn.render
                            ? firstColumn.render((row as Record<string, any>)[firstColumn.key], row)
                            : String((row as Record<string, any>)[firstColumn.key] ?? '-')}
                        </Text>
                      </Box>
                    )}

                    {/* Card Body - Diğer sütunlar */}
                    <Stack gap="xs" className={classes.cardBody}>
                      {bodyColumns.map((column) => {
                        const value = (row as Record<string, any>)[column.key];
                        const renderedValue = column.render ? column.render(value, row) : String(value ?? '-');

                        // Label çevirisi
                        const getLabel = () => {
                          const isI18nKey = column.label.includes('.') &&
                                           !column.label.includes(' ') &&
                                           column.label.length > 3 &&
                                           /^[a-z]+\.[a-z_]+/.test(column.label);

                          if (isI18nKey) {
                            const translated = t(column.label);
                            if (translated !== column.label && translated) return translated;
                            const translatedGlobal = tGlobal(column.label);
                            if (translatedGlobal !== column.label && translatedGlobal) return translatedGlobal;
                          }
                          return column.label;
                        };

                        return (
                          <Group key={column.key} justify="space-between" wrap="nowrap" className={classes.cardRow}>
                            <Text size="sm" c="dimmed" className={classes.cardLabel}>
                              {getLabel()}
                            </Text>
                            <Box className={classes.cardValue}>
                              {renderedValue}
                            </Box>
                          </Group>
                        );
                      })}
                    </Stack>

                    {/* Card Footer - Actions */}
                    {actionsColumn && (
                      <Box className={classes.cardActions}>
                        {actionsColumn.render
                          ? actionsColumn.render((row as Record<string, any>)[actionsColumn.key], row)
                          : null}
                      </Box>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div
            {...(classes.tableWrapper ? { className: classes.tableWrapper } : {})}
            style={{
              ['--table-vertical-border' as string]: styleSettings.showVerticalBorders
                ? '1px solid var(--mantine-color-gray-3)'
                : 'none',
              ['--table-header-bg' as string]: styleSettings.headerBackgroundColor || 'transparent',
            }}
          >
          <Table
            highlightOnHover
            striped
            withColumnBorders={styleSettings.showVerticalBorders}
          >
            <Table.Thead style={{ backgroundColor: styleSettings.headerBackgroundColor || undefined }}>
              <Table.Tr>
                {showRowNumbers && (
                  <Table.Th style={{
                    width: 50,
                    textAlign: 'center',
                    backgroundColor: styleSettings.headerBackgroundColor || undefined,
                    color: getContrastColor(styleSettings.headerBackgroundColor),
                  }}>
                    <Text size="sm" fw={600} style={{ color: 'inherit' }}>
                      #
                    </Text>
                  </Table.Th>
                )}
                {selectable && (
                  <Table.Th style={{
                    width: 40,
                    textAlign: 'center',
                    backgroundColor: styleSettings.headerBackgroundColor || undefined,
                    color: getContrastColor(styleSettings.headerBackgroundColor),
                  }}>
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </Table.Th>
                )}
                {displayColumns.map((column, columnIndex) => {
                  const isSortable = sortable && column.sortable !== false;
                  const isSorted = sortColumn === column.key;
                  const isFirstColumn = columnIndex === 0;
                  const isLastColumn = columnIndex === displayColumns.length - 1;
                  const isActionsColumn = column.key === 'actions';
                  // Otomatik align: İlk sütun sola, son sütun (actions) sağa, ortadaki sütunlar ortalı
                  // Actions sütunu için align property'si varsa onu kullan, yoksa right
                  // Diğer ortadaki sütunlar için her zaman center (align property'si olsa bile)
                  const align = isActionsColumn
                    ? (column.align || 'right')
                    : (isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
                  const headerTextColor = getContrastColor(styleSettings.headerBackgroundColor);
                  return (
                    <Table.Th
                      key={column.key}
                      className={isSorted ? 'sorted' : ''}
                      style={{
                        cursor: isSortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        transition: 'background-color 0.2s, color 0.2s',
                        textAlign: align,
                        backgroundColor: styleSettings.headerBackgroundColor || undefined,
                        color: headerTextColor,
                      }}
                      onClick={() => isSortable && handleSort(column.key)}
                    >
                      <Group gap="xs" wrap="nowrap" justify={align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'}>
                        <Text size="sm" fw={600} style={{ color: 'inherit' }}>
                          {(() => {
                            // Eğer label bir i18n key ise (nokta içeriyorsa ve boşluk yoksa), çevir
                            const isI18nKey = column.label.includes('.') &&
                                             !column.label.includes(' ') &&
                                             column.label.length > 3 &&
                                             /^[a-z]+\.[a-z_]+/.test(column.label);

                            if (isI18nKey) {
                              const translated = t(column.label);
                              // Eğer çeviri başarılıysa (key'den farklıysa ve boş değilse), çevrilmiş değeri kullan
                              if (translated !== column.label && translated) {
                                return translated;
                              }
                              // Çeviri başarısız olduysa, tGlobal ile de dene
                              const translatedGlobal = tGlobal(column.label);
                              if (translatedGlobal !== column.label && translatedGlobal) {
                                return translatedGlobal;
                              }
                            }
                            // Değilse veya çeviri başarısız olduysa, olduğu gibi göster
                            return column.label;
                          })()}
                        </Text>
                        {isSortable && (
                          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {getSortIcon(column.key)}
                          </div>
                        )}
                      </Group>
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedData.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={displayColumns.length + (selectable ? 1 : 0) + (showRowNumbers ? 1 : 0)} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Text c="dimmed">{emptyMessage || tGlobal('empty.message')}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedData.map((row, rowIndex) => {
                  const rowId = row[rowIdKey];
                  const isRowSelected = selectedRows.includes(rowId);
                  // Calculate actual row number (considering pagination)
                  const rowNumber = startIndex + rowIndex + 1;
                  return (
                  <Table.Tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row)}
                    style={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      backgroundColor: isRowSelected ? 'var(--mantine-color-blue-light)' : undefined,
                    }}
                  >
                    {showRowNumbers && (
                      <Table.Td style={{ width: 50, textAlign: 'center' }}>
                        <Text size="sm" c="dimmed">{rowNumber}</Text>
                      </Table.Td>
                    )}
                    {selectable && (
                      <Table.Td style={{ width: 40, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isRowSelected}
                          onChange={() => handleSelectRow(rowId)}
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                      </Table.Td>
                    )}
                    {displayColumns.map((column, columnIndex) => {
                      const isFirstColumn = columnIndex === 0;
                      const isLastColumn = columnIndex === displayColumns.length - 1;
                      const isActionsColumn = column.key === 'actions';
                      // Otomatik align: İlk sütun sola, son sütun (actions) sağa, ortadaki sütunlar ortalı
                      // Actions sütunu için align property'si varsa onu kullan, yoksa right
                      // Diğer ortadaki sütunlar için her zaman center (align property'si olsa bile)
                      const align = isActionsColumn
                        ? (column.align || 'right')
                        : (isFirstColumn ? 'left' : isLastColumn ? 'right' : 'center');
                      const cellTextColor = getContrastColor(column.backgroundColor);
                      return (
                        <Table.Td
                          key={column.key}
                          style={{
                            textAlign: align,
                            backgroundColor: column.backgroundColor || undefined,
                            color: cellTextColor,
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
                            alignItems: 'center',
                            width: '100%',
                            color: 'inherit',
                          }}>
                            {column.render ? column.render((row as Record<string, any>)[column.key], row) : String((row as Record<string, any>)[column.key] ?? '-')}
                          </div>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </div>
        )}

        {/* Pagination */}
        {pageable && processedData.length > 0 && (
          <Group justify="space-between" mt="md" pt="md" {...(classes.pagination ? { className: classes.pagination } : {})}>
            <Group gap="md">
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  {tGlobal('table.pagination.recordsPerPage')}
                </Text>
                <Select
                  value={String(pageSize)}
                  onChange={handlePageSizeChange}
                  data={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
                  size="sm"
                  style={{ width: 80 }}
                />
              </Group>
              <Text size="sm" c="dimmed">
                {startRecord} - {endRecord} {tGlobal('table.pagination.of')} {processedData.length} {tGlobal('table.pagination.showing')}
              </Text>
            </Group>
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={handlePageChange}
            />
          </Group>
        )}
      </Stack>

      {/* Filter Modal */}
      {filters.length > 0 && (
        <FilterModal
          opened={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filters={filters}
          activeFilters={activeFilters}
          onApply={handleFilter}
          onClear={handleFilterClear}
          namespace={exportNamespace}
        />
      )}

      {/* Column Settings Modal */}
      {showColumnSettings && (
        <ColumnSettingsModal
          opened={showColumnSettingsModal}
          onClose={() => setShowColumnSettingsModal(false)}
          columns={visibleColumns.map((col) => {
            const column: ColumnSettingsColumn = {
              key: col.key,
              label: col.label,
            };
            if (col.sortable !== undefined) column.sortable = col.sortable;
            if (col.searchable !== undefined) column.searchable = col.searchable;
            if (col.filterable !== undefined) column.filterable = col.filterable;
            if (col.hidden !== undefined) column.hidden = col.hidden;
            if (col.backgroundColor !== undefined) column.backgroundColor = col.backgroundColor;
            return column;
          })}
          onColumnReorder={handleColumnReorder}
          onColumnToggle={handleColumnToggle}
          styleSettings={styleSettings}
          onStyleSettingsChange={handleStyleSettingsChange}
          onReset={() => {
            setVisibleColumns(columns);
            setStyleSettings({ showVerticalBorders: false, headerBackgroundColor: '' });
            onColumnReorder?.(columns);
            // Clear localStorage when reset
            if (tableId) {
              try {
                localStorage.removeItem(`datatable-columns-${tableId}`);
                localStorage.removeItem(`datatable-style-${tableId}`);
              } catch (e) {
                console.warn('Failed to remove column settings from localStorage:', e);
              }
            }
          }}
        />
      )}
    </Paper>
  );
}

