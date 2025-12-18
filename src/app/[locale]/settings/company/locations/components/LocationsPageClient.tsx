'use client';

import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Stack, Badge, Button, Modal, TextInput, Select, Textarea, Checkbox, Group, Text, ActionIcon, Tooltip, Card, Tabs, NumberInput, Anchor, Skeleton } from '@mantine/core';
import { IconMapPin, IconPlus, IconEdit, IconTrash, IconEye, IconMap, IconList, IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation, type Location } from '@/hooks/useLocations';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { LocationMapView } from './LocationMapView';

// Google Maps linkinden koordinatları çıkaran yardımcı fonksiyon (API key gerektirmez)
async function extractCoordinatesFromGoogleMapsLink(link: string): Promise<{ 
  lat: number; 
  lng: number; 
} | null> {
  try {
    // Kısa link kontrolü (goo.gl, maps.app.goo.gl)
    if (link.includes('goo.gl/') || link.includes('maps.app.goo.gl/')) {
      try {
        // Backend API kullanarak kısa linki çöz
        const response = await fetch('/api/utils/resolve-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: link }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.resolvedUrl) {
            link = data.data.resolvedUrl;
          }
        }
      } catch (error) {
        // Fetch başarısız olursa orijinal linki kullan
      }
    }

    // Format 1: https://www.google.com/maps?q=41.0082,28.9784
    const qMatch = link.match(/[?&]q=([^&]+)/);
    if (qMatch && qMatch[1]) {
      const qValue = decodeURIComponent(qMatch[1]);
      // Koordinat kontrolü (sayısal değerler)
      const coords = qValue.split(',');
      if (coords.length >= 2) {
        const parsedLat = parseFloat((coords[0]?.trim() ?? '0') || '0');
        const parsedLng = parseFloat((coords[1]?.trim() ?? '0') || '0');
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          return { lat: parsedLat, lng: parsedLng };
        }
      }
    }

    // Format 2: https://www.google.com/maps/@41.0082,28.9784,15z
    const atMatch = link.match(/@([^,]+),([^,]+)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]?.trim() || '0');
      const lng = parseFloat(atMatch[2]?.trim() || '0');
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }

    // Format 3: https://maps.google.com/?q=41.0082,28.9784
    const mapsMatch = link.match(/\/\?q=([^&]+)/);
    if (mapsMatch) {
      const coords = mapsMatch[1]?.split(',') || [];
      if (coords.length >= 2) {
        const lat = parseFloat(coords[0]?.trim() || '0');
        const lng = parseFloat(coords[1]?.trim() || '0');
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }

    // Format 4: https://www.google.com/maps/place/Place+Name/@41.0082,28.9784,15z
    const placeMatch = link.match(/\/place\/[^@]+@([^,]+),([^,]+)/);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]?.trim() || '0');
      const lng = parseFloat(placeMatch[2]?.trim() || '0');
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export interface LocationsPageClientRef {
  openCreateForm: () => void;
  openSubAreaForm: () => void;
}

const LocationsPageClientComponent = forwardRef<LocationsPageClientRef, {}>((props, ref) => {
  const { t } = useTranslation('global');
  
  const [page] = useState(1);
  const [pageSize] = useState(25);
  const [search] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();
  
  const [activeTab, setActiveTab] = useState<string | null>('list');
  const [showForm, setShowForm] = useState(false);
  const [showSubAreaForm, setShowSubAreaForm] = useState(false);
  const [showSubAreaEditForm, setShowSubAreaEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingSubArea, setEditingSubArea] = useState<Location | null>(null);
  
  // Valid location types for validation
  const validTypes = ['headquarters', 'branch', 'warehouse', 'office', 'factory', 'store', 'other'];
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [parentLocationForSubArea, setParentLocationForSubArea] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'branch',
    sub_type: undefined as string | undefined,
    column_number: undefined as number | undefined,
    parentId: undefined as string | undefined,
    address: '',
    city: '',
    state: '',
    country: 'TR',
    postalCode: '',
    phone: '',
    email: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    googleMapsLink: '',
    isActive: true,
    description: '',
  });

  const { data, isLoading } = useLocations({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  // Build hierarchical locations list
  const hierarchicalLocations = useMemo(() => {
    if (!data?.locations) return [];
    
    const locationMap = new Map<string, Location & { children?: Location[] }>();
    const rootLocations: Location[] = [];

    // Create map of all locations
    data.locations.forEach(loc => {
      locationMap.set(loc.id, { ...loc, children: [] });
    });

    // Build hierarchy
    data.locations.forEach(loc => {
      const locationWithChildren = locationMap.get(loc.id);
      if (locationWithChildren) {
        if (loc.parentId) {
          const parent = locationMap.get(loc.parentId);
          if (parent && parent.children) {
            parent.children.push(locationWithChildren);
          } else {
            rootLocations.push(locationWithChildren);
          }
        } else {
          rootLocations.push(locationWithChildren);
        }
      }
    });

    // Flatten hierarchy for display
    const flattenHierarchy = (items: (Location & { children?: Location['children'] })[], level: number = 0): Location[] => {
      const result: Location[] = [];
      items.forEach(item => {
        const { children, ...locationWithoutChildren } = item;
        result.push(locationWithoutChildren);
        if (children && children.length > 0) {
          result.push(...flattenHierarchy(children as (Location & { children?: Location['children'] })[], level + 1));
        }
      });
      return result;
    };

    return flattenHierarchy(rootLocations);
  }, [data?.locations]);

  // Get indent level for hierarchical display
  const getIndentLevel = useCallback((location: Location, allLocations?: Location[]): number => {
    const locsToSearch = allLocations || hierarchicalLocations || data?.locations || [];
    let level = 0;
    let current: Location | undefined = location;
    const visited = new Set<string>();
    
    while (current && current.parentId) {
      if (visited.has(current.id)) break; // Prevent infinite loops
      visited.add(current.id);
      level++;
      const parent = locsToSearch.find(l => l.id === current!.parentId);
      if (!parent) break;
      current = parent;
    }
    
    return level;
  }, [hierarchicalLocations, data?.locations]);
  
  // Handler functions - defined before columns to avoid initialization error
  const handleView = useCallback((location: Location) => {
    setViewingLocation(location);
    setShowDetailModal(true);
  }, []);

  const handleEditSubArea = useCallback((location: Location) => {
    setEditingSubArea(location);
    setEditingLocation(null);
    // Parent location'ı bul
    const parent = data?.locations.find(loc => loc.id === location.parentId);
    if (parent) {
      setParentLocationForSubArea(parent);
    }
    setFormData({
      name: location.name,
      code: location.code || '',
      type: parent?.type || location.type, // Parent'ın type'ını kullan
      sub_type: undefined,
      column_number: undefined,
      parentId: location.parentId || undefined,
      address: location.address || '',
      city: location.city || '',
      state: '',
      country: location.country || 'TR',
      postalCode: location.postalCode || '',
      phone: (location.metadata as any)?.phone || '',
      email: (location.metadata as any)?.email || '',
      latitude: (location as any).latitude ? Number((location as any).latitude) : undefined,
      longitude: (location as any).longitude ? Number((location as any).longitude) : undefined,
      googleMapsLink: '',
      isActive: location.isActive,
      description: location.description || '',
    });
    setShowSubAreaEditForm(true);
    setShowForm(false);
    setShowSubAreaForm(false);
  }, [data?.locations]);

  const handleEdit = useCallback((location: Location) => {
    // Sadece ana lokasyonları düzenle (parentId yoksa)
    if (location.parentId) {
      // Alt alan ise alt alan düzenleme modalını aç
      handleEditSubArea(location);
      return;
    }
    setEditingLocation(location);
    setEditingSubArea(null);
    setFormData({
      name: location.name,
      code: location.code || '',
      type: location.type,
      sub_type: undefined,
      column_number: undefined,
      parentId: location.parentId || undefined,
      address: location.address || '',
      city: location.city || '',
      state: '',
      country: location.country || 'TR',
      postalCode: location.postalCode || '',
      phone: (location.metadata as any)?.phone || '',
      email: (location.metadata as any)?.email || '',
      latitude: (location as any).latitude ? Number((location as any).latitude) : undefined,
      longitude: (location as any).longitude ? Number((location as any).longitude) : undefined,
      googleMapsLink: '',
      isActive: location.isActive,
      description: location.description || '',
    });
    setShowForm(true);
    setShowSubAreaForm(false);
    setShowSubAreaEditForm(false);
  }, [handleEditSubArea]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t('settings.locations.deleteConfirm'))) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      showToast({
        type: 'success',
        title: t('settings.locations.success'),
        message: t('settings.locations.deleteSuccess'),
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('settings.locations.error'),
        message: error.message || t('settings.locations.deleteError'),
      });
    }
  }, [t, deleteMutation]);

  // Table columns
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'name',
      label: t('settings.locations.columns.name'),
      sortable: true,
      searchable: true,
      render: (value, row) => {
        const location = row as Location;
        const indentLevel = getIndentLevel(location, hierarchicalLocations);
        const indentWidth = indentLevel * 24;
        
        return (
          <Group gap="xs" style={{ paddingLeft: `${indentWidth}px` }} align="center" wrap="nowrap">
            {indentLevel > 0 && (
              <Text c="dimmed" size="xs" style={{ userSelect: 'none', minWidth: '20px' }}>
                {'└─'}
              </Text>
            )}
            <Text fw={indentLevel === 0 ? 600 : 500} size={indentLevel === 0 ? 'md' : 'sm'}>
              {value}
            </Text>
          </Group>
        );
      }
    },
    {
      key: 'code',
      label: t('settings.locations.columns.code'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Badge variant="light" color="blue">
          {value || '-'}
        </Badge>
      )
    },
    {
      key: 'type',
      label: t('settings.locations.columns.type'),
      sortable: true,
      render: (value, row) => {
        const location = row as Location;
        // Alt alan için parent'ın type'ını göster
        let displayType = location.type;
        if (location.parentId) {
          // Önce data?.locations içinde ara
          const parent = data?.locations?.find(loc => loc.id === location.parentId);
          if (parent && parent.type) {
            displayType = parent.type;
          } else {
            // Fallback: hierarchicalLocations içinde ara (flatten edilmiş liste)
            const parentInHierarchy = hierarchicalLocations.find(loc => loc.id === location.parentId);
            if (parentInHierarchy && parentInHierarchy.type) {
              displayType = parentInHierarchy.type;
            }
            // Eğer parent bulunamazsa location.type kullanılacak (zaten "other" olabilir)
          }
        }
        
        const typeLabels: Record<string, string> = {
          headquarters: t('settings.locations.types.headquarters'),
          branch: t('settings.locations.types.branch'),
          warehouse: t('settings.locations.types.warehouse'),
          office: t('settings.locations.types.office'),
          factory: t('settings.locations.types.factory'),
          store: t('settings.locations.types.store'),
          other: t('settings.locations.types.other'),
        };
        
        const typeColors: Record<string, string> = {
          headquarters: 'purple',
          branch: 'blue',
          warehouse: 'green',
          office: 'yellow',
          factory: 'red',
          store: 'indigo',
          other: 'gray',
        };
        
        return (
          <Badge color={typeColors[displayType as string] || 'gray'} variant="light">
            {typeLabels[displayType as string] || displayType}
          </Badge>
        );
      }
    },
    {
      key: 'city',
      label: t('settings.locations.columns.city'),
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <Text size="sm" c="dimmed">
          {value && row.state ? `${value}, ${row.state}` : value || '-'}
        </Text>
      )
    },
    {
      key: 'isActive',
      label: t('settings.locations.columns.status'),
      sortable: true,
      render: (value) => (
        <Badge color={value ? 'green' : 'red'} variant="light">
          {value ? t('settings.locations.status.active') : t('settings.locations.status.inactive')}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: t('settings.locations.columns.actions'),
      sortable: false,
      render: (_, row) => {
        const location = row as Location;
        const isSubArea = !!location.parentId;
        return (
          <Group gap="xs" justify="flex-end">
            <Tooltip label={t('settings.locations.view')}>
              <ActionIcon variant="light" onClick={() => handleView(location)}>
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
            {!isSubArea && (
              <Tooltip label={t('settings.locations.edit')}>
                <ActionIcon 
                  variant="light" 
                  color="blue" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(location);
                  }}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {isSubArea && (
              <Tooltip label={t('settings.locations.editSubArea')}>
                <ActionIcon variant="light" color="orange" onClick={() => handleEditSubArea(location)}>
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {!isSubArea && (
              <Tooltip label={t('settings.locations.addSubArea')}>
                <ActionIcon variant="light" color="green" onClick={() => {
                  setParentLocationForSubArea(location);
                  resetForm();
                  setFormData(prev => ({ ...prev, parentId: location.id, type: location.type }));
                  setShowSubAreaForm(true);
                  setShowForm(false);
                  setShowSubAreaEditForm(false);
                }}>
                  <IconPlus size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label={t('settings.locations.delete')}>
              <ActionIcon 
                variant="light" 
                color="red" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(location.id);
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      }
    },
  ], [t, getIndentLevel, hierarchicalLocations, handleView, handleEdit, handleEditSubArea, handleDelete, data?.locations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation: name is required
      if (!formData.name || !formData.name.trim()) {
        showToast({
          type: 'error',
          title: t('settings.locations.error'),
          message: t('settings.locations.form.nameRequired'),
        });
        return;
      }

      // Validation: type is required
      if (!formData.type) {
        showToast({
          type: 'error',
          title: t('settings.locations.error'),
          message: t('settings.locations.form.typeRequired'),
        });
        return;
      }

      const submitData: any = {
        name: formData.name.trim(),
        code: formData.code?.trim() || undefined,
        type: formData.type && validTypes.includes(formData.type) ? formData.type : undefined,
        description: formData.description?.trim() || undefined,
        parentId: formData.parentId || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        latitude: formData.latitude !== undefined && formData.latitude !== null && !isNaN(Number(formData.latitude)) ? Number(formData.latitude) : undefined,
        longitude: formData.longitude !== undefined && formData.longitude !== null && !isNaN(Number(formData.longitude)) ? Number(formData.longitude) : undefined,
        isActive: formData.isActive !== undefined ? Boolean(formData.isActive) : true,
      };
      
      // Add phone and email to metadata if provided
      if (formData.phone?.trim() || formData.email?.trim()) {
        submitData.metadata = {
          ...(formData.phone?.trim() ? { phone: formData.phone.trim() } : {}),
          ...(formData.email?.trim() ? { email: formData.email.trim() } : {}),
        };
      }

      if (editingLocation) {
        await updateMutation.mutateAsync({ id: editingLocation.id, data: submitData });
        showToast({
          type: 'success',
          title: t('settings.locations.success'),
          message: t('settings.locations.updateSuccess'),
        });
      } else {
        await createMutation.mutateAsync(submitData);
        showToast({
          type: 'success',
          title: t('settings.locations.success'),
          message: t('settings.locations.createSuccess'),
        });
      }
      
      setShowForm(false);
      setEditingLocation(null);
      resetForm();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || error?.toString() || t('settings.locations.saveError');
      showToast({
        type: 'error',
        title: t('settings.locations.error'),
        message: errorMessage,
      });
    }
  };

  const generateCodeFromName = (name: string): string => {
    if (!name) return '';
    
    const turkishChars: { [key: string]: string } = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G',
      'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };
    
    let code = name
      .split('')
      .map(char => turkishChars[char] || char)
      .join('');
    
    code = code
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toUpperCase()
      .substring(0, 20);
    
    return code;
  };

  const handleSubAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalParentId = formData.parentId || parentLocationForSubArea?.id;
    if (!finalParentId) {
      showToast({
        type: 'error',
        title: t('settings.locations.error'),
        message: t('settings.locations.noParentSelected'),
      });
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      showToast({
        type: 'error',
        title: t('settings.locations.error'),
        message: t('settings.locations.nameRequired'),
      });
      return;
    }

    // Determine type: parent type > form type > default 'other'
    let locationType: string;
    if (parentLocationForSubArea?.type && validTypes.includes(parentLocationForSubArea.type)) {
      locationType = parentLocationForSubArea.type;
    } else if (formData.type && validTypes.includes(formData.type)) {
      locationType = formData.type;
    } else {
      locationType = 'other'; // Default type if none provided
    }

    try {
      const submitData: any = {
        name: formData.name.trim(),
        code: formData.code?.trim() || undefined,
        type: locationType,
        description: formData.description?.trim() || undefined,
        parentId: finalParentId,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        latitude: formData.latitude !== undefined && formData.latitude !== null ? formData.latitude : undefined,
        longitude: formData.longitude !== undefined && formData.longitude !== null ? formData.longitude : undefined,
        isActive: formData.isActive,
      };
      
      // Add phone and email to metadata if provided
      if (formData.phone?.trim() || formData.email?.trim()) {
        submitData.metadata = {
          ...(formData.phone?.trim() ? { phone: formData.phone.trim() } : {}),
          ...(formData.email?.trim() ? { email: formData.email.trim() } : {}),
        };
      }

      await createMutation.mutateAsync(submitData);
      showToast({
        type: 'success',
        title: t('settings.locations.success'),
        message: t('settings.locations.createSubAreaSuccess'),
      });
      
      setShowSubAreaForm(false);
      setParentLocationForSubArea(null);
      resetForm();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('settings.locations.error'),
        message: error.message || t('settings.locations.saveError'),
      });
    }
  };

  const handleSubAreaEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSubArea) {
      return;
    }

    const finalParentId = formData.parentId || parentLocationForSubArea?.id;
    if (!finalParentId) {
      showToast({
        type: 'error',
        title: t('settings.locations.error'),
        message: t('settings.locations.noParentSelected'),
      });
      return;
    }

    // Determine type: parent type > form type > default 'other'
    let locationType: string;
    if (parentLocationForSubArea?.type && validTypes.includes(parentLocationForSubArea.type)) {
      locationType = parentLocationForSubArea.type;
    } else if (formData.type && validTypes.includes(formData.type)) {
      locationType = formData.type;
    } else {
      locationType = 'other'; // Default type if none provided
    }

    try {
      const submitData: any = {
        name: formData.name,
        code: formData.code?.trim() || undefined,
        type: locationType,
        description: formData.description?.trim() || undefined,
        parentId: finalParentId,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        postalCode: formData.postalCode?.trim() || undefined,
        latitude: formData.latitude !== undefined && formData.latitude !== null ? formData.latitude : undefined,
        longitude: formData.longitude !== undefined && formData.longitude !== null ? formData.longitude : undefined,
        isActive: formData.isActive,
      };
      
      // Add phone and email to metadata if provided
      if (formData.phone?.trim() || formData.email?.trim()) {
        submitData.metadata = {
          ...(formData.phone?.trim() ? { phone: formData.phone.trim() } : {}),
          ...(formData.email?.trim() ? { email: formData.email.trim() } : {}),
        };
      }

      await updateMutation.mutateAsync({ id: editingSubArea.id, data: submitData });
      showToast({
        type: 'success',
        title: t('settings.locations.success'),
        message: t('settings.locations.updateSubAreaSuccess'),
      });
      
      setShowSubAreaEditForm(false);
      setEditingSubArea(null);
      setParentLocationForSubArea(null);
      resetForm();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: t('settings.locations.error'),
        message: error.message || t('settings.locations.saveError'),
      });
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      code: '',
      type: 'branch',
      sub_type: undefined,
      column_number: undefined,
      parentId: undefined,
      address: '',
      city: '',
      state: '',
      country: 'TR',
      postalCode: '',
      phone: '',
      email: '',
      latitude: undefined,
      longitude: undefined,
      googleMapsLink: '',
      isActive: true,
      description: '',
    });
    setEditingLocation(null);
    setEditingSubArea(null);
    setParentLocationForSubArea(null);
  }, []);

  const displayLocations = useMemo(() => {
    const locations = hierarchicalLocations.length > 0 ? hierarchicalLocations : (data?.locations || []);
    return locations;
  }, [hierarchicalLocations, data?.locations]);

  // Alt alan modalı açıldığında parent'ın type'ını formData'ya set et
  useEffect(() => {
    if (showSubAreaForm && parentLocationForSubArea?.type) {
      setFormData(prev => ({
        ...prev,
        type: parentLocationForSubArea.type,
      }));
    }
  }, [showSubAreaForm, parentLocationForSubArea?.type]);

  const openCreateForm = useCallback(() => {
    resetForm();
    setShowForm(true);
    setShowSubAreaForm(false);
    setShowSubAreaEditForm(false);
  }, [resetForm]);

  const openSubAreaForm = useCallback(() => {
    if (data?.locations && data.locations.length === 0) {
      showToast({
        type: 'warning',
        title: t('settings.locations.warning'),
        message: t('settings.locations.noParentLocation'),
      });
      return;
    }
    setParentLocationForSubArea(null);
    resetForm();
    setShowSubAreaForm(true);
    setShowForm(false);
    setShowSubAreaEditForm(false);
  }, [data?.locations, t, resetForm]);

  useImperativeHandle(ref, () => ({
    openCreateForm,
    openSubAreaForm,
  }), [openCreateForm, openSubAreaForm]);

  return (
    <>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="list" leftSection={<IconList size={16} />}>
            {t('settings.locations.table.name')}
          </Tabs.Tab>
          <Tabs.Tab value="map" leftSection={<IconMap size={16} />}>
            {t('settings.locations.map.title')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="list" pt="md">
          {isLoading ? (
            <Stack gap="md">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={50} radius="sm" />
              ))}
            </Stack>
          ) : (
            <DataTable
              columns={columns}
              data={displayLocations}
              searchable={true}
              sortable={true}
              pageable={true}
              defaultPageSize={pageSize}
              emptyMessage={t('settings.locations.noData')}
              onRowClick={(row) => {
                // Sadece row'a tıklandığında görüntüle, action icon'lara tıklandığında değil
                const target = (window.event as any)?.target;
                if (target && (target.closest('button') || target.closest('[role="button"]') || target.closest('a'))) {
                  return; // Action icon'a tıklandıysa görüntüleme modalını açma
                }
                handleView(row as Location);
              }}
            filters={[
              {
                key: 'type',
                label: t('settings.locations.filters.type'),
                type: 'select',
                options: [
                  { value: 'headquarters', label: t('settings.locations.types.headquarters') },
                  { value: 'branch', label: t('settings.locations.types.branch') },
                  { value: 'warehouse', label: t('settings.locations.types.warehouse') },
                  { value: 'office', label: t('settings.locations.types.office') },
                  { value: 'factory', label: t('settings.locations.types.factory') },
                  { value: 'store', label: t('settings.locations.types.store') },
                  { value: 'other', label: t('settings.locations.types.other') },
                ]
              },
              {
                key: 'isActive',
                label: t('settings.locations.filters.status'),
                type: 'select',
                options: [
                  { value: 'true', label: t('settings.locations.status.active') },
                  { value: 'false', label: t('settings.locations.status.inactive') },
                ]
              },
            ]}
            onFilter={(filters) => {
              setTypeFilter(filters.type);
              setIsActiveFilter(filters.isActive === 'true' ? true : filters.isActive === 'false' ? false : undefined);
            }}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="map" pt="md">
          {activeTab === 'map' && (
            <LocationMapView key={`map-${activeTab}`} locations={displayLocations} />
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Location Form Modal */}
      <Modal
        opened={showForm}
        onClose={() => {
          setShowForm(false);
          setShowSubAreaForm(false);
          setShowSubAreaEditForm(false);
          resetForm();
        }}
        title={
          <Group gap="sm">
            <IconMapPin size={24} color="var(--mantine-color-blue-6)" />
            <Text fw={600} size="lg">
              {editingLocation ? t('settings.locations.editLocation') : t('settings.locations.createLocation')}
            </Text>
          </Group>
        }
        size="lg"
        centered
        styles={{
          content: {
            maxWidth: '90vw',
            width: '800px',
            overflow: 'hidden',
          },
          body: {
            overflowY: 'auto',
            overflowX: 'hidden',
            maxHeight: 'calc(90vh - 140px)',
          },
        }}
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <Group grow>
              <TextInput
                label={t('settings.locations.form.name')}
                required
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({
                    ...formData,
                    name: newName,
                    code: !formData.code || formData.code === generateCodeFromName(formData.name)
                      ? generateCodeFromName(newName)
                      : formData.code
                  });
                }}
              />
              <TextInput
                label={t('settings.locations.form.code')}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </Group>
            <Group grow>
              <Select
                label={t('settings.locations.form.type')}
                required
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value || 'branch' })}
                data={[
                  { value: 'headquarters', label: t('settings.locations.types.headquarters') },
                  { value: 'branch', label: t('settings.locations.types.branch') },
                  { value: 'warehouse', label: t('settings.locations.types.warehouse') },
                  { value: 'office', label: t('settings.locations.types.office') },
                  { value: 'factory', label: t('settings.locations.types.factory') },
                  { value: 'store', label: t('settings.locations.types.store') },
                  { value: 'other', label: t('settings.locations.types.other') },
                ]}
              />
              <Select
                label={t('settings.locations.form.parent')}
                value={formData.parentId || null}
                onChange={(value) => setFormData({ ...formData, parentId: value || undefined })}
                data={data?.locations
                  .filter(loc => !loc.parentId && loc.id !== editingLocation?.id)
                  .map(loc => ({ value: loc.id, label: loc.name })) || []}
                clearable
              />
            </Group>
            <TextInput
              label={t('settings.locations.form.address')}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Group grow>
              <TextInput
                label={t('settings.locations.form.city')}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <TextInput
                label={t('settings.locations.form.country')}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
              <TextInput
                label={t('settings.locations.form.postalCode')}
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </Group>
            
            <Group grow>
              <TextInput
                label={t('settings.locations.form.phone')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('settings.locations.form.phonePlaceholder')}
              />
              <TextInput
                label={t('settings.locations.form.email')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                type="email"
                placeholder={t('settings.locations.form.emailPlaceholder')}
              />
            </Group>
            
            <Text size="sm" fw={500} mt="xs" mb="xs">
              {t('settings.locations.map.description')}
            </Text>
            <TextInput
              label={t('settings.locations.form.googleMapsLink')}
              value={formData.googleMapsLink || ''}
              onChange={async (e) => {
                const link = e.target.value;
                setFormData({ ...formData, googleMapsLink: link });
                
                // Google Maps linkinden koordinatları çıkar (API key gerektirmez)
                if (link && (link.includes('google.com/maps') || link.includes('goo.gl/') || link.includes('maps.app.goo.gl/'))) {
                  try {
                    const coords = await extractCoordinatesFromGoogleMapsLink(link);
                    if (coords) {
                      setFormData(prev => ({
                        ...prev,
                        googleMapsLink: link,
                        latitude: coords.lat,
                        longitude: coords.lng,
                      }));
                    }
                  } catch (error) {
                    // Silently handle coordinate extraction errors
                  }
                }
              }}
              placeholder={t('settings.locations.form.googleMapsLinkPlaceholder')}
              description={t('settings.locations.form.googleMapsLinkDescription')}
            />
            <Group grow>
              <NumberInput
                label={t('settings.locations.form.latitude')}
                {...(formData.latitude !== undefined ? { value: formData.latitude } : {})}
                onChange={(value) => setFormData({ ...formData, latitude: value ? Number(value) : undefined })}
                decimalScale={8}
                min={-90}
                max={90}
                placeholder={t('settings.locations.form.latitudePlaceholder')}
              />
              <NumberInput
                label={t('settings.locations.form.longitude')}
                {...(formData.longitude !== undefined ? { value: formData.longitude } : {})}
                onChange={(value) => setFormData({ ...formData, longitude: value ? Number(value) : undefined })}
                decimalScale={8}
                min={-180}
                max={180}
                placeholder={t('settings.locations.form.longitudePlaceholder')}
              />
            </Group>
            
            <Textarea
              label={t('settings.locations.form.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <Checkbox
              label={t('settings.locations.form.isActive')}
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => {
                setShowForm(false);
                resetForm();
              }}>
                {t('settings.locations.cancel')}
              </Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingLocation ? t('settings.locations.update') : t('settings.locations.create')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Sub-Area Form Modal */}
      <Modal
        opened={showSubAreaForm}
        onClose={() => {
          setShowSubAreaForm(false);
          setShowForm(false);
          setShowSubAreaEditForm(false);
          setParentLocationForSubArea(null);
          resetForm();
        }}
        title={
          <Group gap="sm">
            <IconMapPin size={24} color="var(--mantine-color-blue-6)" />
            <Text fw={600} size="lg">
              {t('settings.locations.createSubArea')}
            </Text>
          </Group>
        }
        size="lg"
        centered
        styles={{
          content: {
            maxWidth: '90vw',
            width: '800px',
            overflow: 'hidden',
          },
          body: {
            overflowY: 'auto',
            overflowX: 'hidden',
            maxHeight: 'calc(90vh - 140px)',
          },
        }}
      >
        <form onSubmit={handleSubAreaSubmit}>
          <Stack gap="lg">
            {parentLocationForSubArea && (
              <Card p="md" withBorder radius="sm" bg="blue.0">
                <Stack gap="xs">
                  <Text size="xs" c="dimmed" fw={500} tt="uppercase">
                    {t('settings.locations.form.parent')}
                  </Text>
                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text fw={600}>{parentLocationForSubArea.name}</Text>
                  </Group>
                </Stack>
              </Card>
            )}
            <Group grow>
              <TextInput
                label={t('settings.locations.form.name')}
                required
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({
                    ...formData,
                    name: newName,
                    code: !formData.code || formData.code === generateCodeFromName(formData.name)
                      ? generateCodeFromName(newName)
                      : formData.code
                  });
                }}
                placeholder={t('settings.locations.form.subAreaNamePlaceholder')}
              />
              <TextInput
                label={t('settings.locations.form.code')}
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={t('settings.locations.form.subAreaCodePlaceholder')}
              />
            </Group>
            {!parentLocationForSubArea && (
              <Select
                label={t('settings.locations.form.parent')}
                required
                value={formData.parentId || null}
                onChange={(value) => {
                  const selectedParent = data?.locations.find(loc => loc.id === value);
                  if (selectedParent) {
                    setFormData({
                      ...formData,
                      parentId: value || undefined,
                      type: selectedParent.type,
                    });
                  } else {
                    setFormData({ ...formData, parentId: value || undefined });
                  }
                }}
                data={data?.locations
                  .filter(loc => !loc.parentId)
                  .map(loc => ({ value: loc.id, label: loc.name })) || []}
              />
            )}
            <TextInput
              label={t('settings.locations.form.address')}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Group grow>
              <TextInput
                label={t('settings.locations.form.city')}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <TextInput
                label={t('settings.locations.form.country')}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
              <TextInput
                label={t('settings.locations.form.postalCode')}
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </Group>
            <Group grow>
              <TextInput
                label={t('settings.locations.form.phone')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('settings.locations.form.phonePlaceholder')}
              />
              <TextInput
                label={t('settings.locations.form.email')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                type="email"
                placeholder={t('settings.locations.form.emailPlaceholder')}
              />
            </Group>
            <Text size="sm" fw={500} mt="xs" mb="xs">
              {t('settings.locations.map.description')}
            </Text>
            <TextInput
              label={t('settings.locations.form.googleMapsLink')}
              value={formData.googleMapsLink || ''}
              onChange={async (e) => {
                const link = e.target.value;
                setFormData({ ...formData, googleMapsLink: link });
                
                // Google Maps linkinden koordinatları çıkar (API key gerektirmez)
                if (link && (link.includes('google.com/maps') || link.includes('goo.gl/') || link.includes('maps.app.goo.gl/'))) {
                  try {
                    const coords = await extractCoordinatesFromGoogleMapsLink(link);
                    if (coords) {
                      setFormData(prev => ({
                        ...prev,
                        googleMapsLink: link,
                        latitude: coords.lat,
                        longitude: coords.lng,
                      }));
                    }
                  } catch (error) {
                    // Silently handle coordinate extraction errors
                  }
                }
              }}
              placeholder={t('settings.locations.form.googleMapsLinkPlaceholder')}
              description={t('settings.locations.form.googleMapsLinkDescription')}
            />
            <Group grow>
              <NumberInput
                label={t('settings.locations.form.latitude')}
                {...(formData.latitude !== undefined ? { value: formData.latitude } : {})}
                onChange={(value) => setFormData({ ...formData, latitude: value ? Number(value) : undefined })}
                decimalScale={8}
                min={-90}
                max={90}
                placeholder={t('settings.locations.form.latitudePlaceholder')}
              />
              <NumberInput
                label={t('settings.locations.form.longitude')}
                {...(formData.longitude !== undefined ? { value: formData.longitude } : {})}
                onChange={(value) => setFormData({ ...formData, longitude: value ? Number(value) : undefined })}
                decimalScale={8}
                min={-180}
                max={180}
                placeholder={t('settings.locations.form.longitudePlaceholder')}
              />
            </Group>
            <Textarea
              label={t('settings.locations.form.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <Checkbox
              label={t('settings.locations.form.isActive')}
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => {
                setShowSubAreaForm(false);
                setParentLocationForSubArea(null);
                resetForm();
              }}>
                {t('settings.locations.cancel')}
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {t('settings.locations.createSubArea')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Sub-Area Edit Modal */}
      <Modal
        opened={showSubAreaEditForm}
        onClose={() => {
          setShowSubAreaEditForm(false);
          setShowForm(false);
          setShowSubAreaForm(false);
          setEditingSubArea(null);
          setParentLocationForSubArea(null);
          resetForm();
        }}
        title={
          <Group gap="sm">
            <IconMapPin size={24} color="var(--mantine-color-blue-6)" />
            <Text fw={600} size="lg">
              {t('settings.locations.editSubArea')}
            </Text>
          </Group>
        }
        size="lg"
        centered
        styles={{
          content: {
            maxWidth: '90vw',
            width: '800px',
            overflow: 'hidden',
          },
          body: {
            overflowY: 'auto',
            overflowX: 'hidden',
            maxHeight: 'calc(90vh - 140px)',
          },
        }}
      >
        <form onSubmit={handleSubAreaEditSubmit}>
          <Stack gap="lg">
            {parentLocationForSubArea && (
              <Card p="md" withBorder radius="sm" bg="blue.0">
                <Stack gap="xs">
                  <Text size="xs" c="dimmed" fw={500} tt="uppercase">
                    {t('settings.locations.form.parent')}
                  </Text>
                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text fw={600}>{parentLocationForSubArea.name}</Text>
                  </Group>
                </Stack>
              </Card>
            )}
            <Group grow>
              <TextInput
                label={t('settings.locations.form.name')}
                required
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({
                    ...formData,
                    name: newName,
                    code: !formData.code || formData.code === generateCodeFromName(formData.name)
                      ? generateCodeFromName(newName)
                      : formData.code
                  });
                }}
                placeholder={t('settings.locations.form.subAreaNamePlaceholder')}
              />
              <TextInput
                label={t('settings.locations.form.code')}
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={t('settings.locations.form.subAreaCodePlaceholder')}
              />
            </Group>
            <TextInput
              label={t('settings.locations.form.address')}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Group grow>
              <TextInput
                label={t('settings.locations.form.city')}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <TextInput
                label={t('settings.locations.form.country')}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
              <TextInput
                label={t('settings.locations.form.postalCode')}
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </Group>
            <Group grow>
              <TextInput
                label={t('settings.locations.form.phone')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('settings.locations.form.phonePlaceholder')}
              />
              <TextInput
                label={t('settings.locations.form.email')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                type="email"
                placeholder={t('settings.locations.form.emailPlaceholder')}
              />
            </Group>
            <Text size="sm" fw={500} mt="xs" mb="xs">
              {t('settings.locations.map.description')}
            </Text>
            <TextInput
              label={t('settings.locations.form.googleMapsLink')}
              value={formData.googleMapsLink || ''}
              onChange={async (e) => {
                const link = e.target.value;
                setFormData({ ...formData, googleMapsLink: link });
                
                // Google Maps linkinden koordinatları çıkar (API key gerektirmez)
                if (link && (link.includes('google.com/maps') || link.includes('goo.gl/') || link.includes('maps.app.goo.gl/'))) {
                  try {
                    const coords = await extractCoordinatesFromGoogleMapsLink(link);
                    if (coords) {
                      setFormData(prev => ({
                        ...prev,
                        googleMapsLink: link,
                        latitude: coords.lat,
                        longitude: coords.lng,
                      }));
                    }
                  } catch (error) {
                    // Silently handle coordinate extraction errors
                  }
                }
              }}
              placeholder={t('settings.locations.form.googleMapsLinkPlaceholder')}
              description={t('settings.locations.form.googleMapsLinkDescription')}
            />
            <Group grow>
              <NumberInput
                label={t('settings.locations.form.latitude')}
                {...(formData.latitude !== undefined ? { value: formData.latitude } : {})}
                onChange={(value) => setFormData({ ...formData, latitude: value ? Number(value) : undefined })}
                decimalScale={8}
                min={-90}
                max={90}
                placeholder={t('settings.locations.form.latitudePlaceholder')}
              />
              <NumberInput
                label={t('settings.locations.form.longitude')}
                {...(formData.longitude !== undefined ? { value: formData.longitude } : {})}
                onChange={(value) => setFormData({ ...formData, longitude: value ? Number(value) : undefined })}
                decimalScale={8}
                min={-180}
                max={180}
                placeholder={t('settings.locations.form.longitudePlaceholder')}
              />
            </Group>
            <Textarea
              label={t('settings.locations.form.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <Checkbox
              label={t('settings.locations.form.isActive')}
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => {
                setShowSubAreaEditForm(false);
                setEditingSubArea(null);
                setParentLocationForSubArea(null);
                resetForm();
              }}>
                {t('settings.locations.cancel')}
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                {t('settings.locations.update')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        opened={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={
          <Group gap="sm">
            <IconMapPin size={24} color="var(--mantine-color-blue-6)" />
            <Text fw={600} size="lg">
              {viewingLocation?.name || t('settings.locations.view')}
            </Text>
          </Group>
        }
        size="lg"
        centered
        styles={{
          content: {
            maxWidth: '90vw',
            width: '800px',
            overflow: 'hidden',
          },
          body: {
            overflowY: 'auto',
            overflowX: 'hidden',
            maxHeight: 'calc(90vh - 140px)',
          },
        }}
      >
        {viewingLocation && (() => {
          const latValue = (viewingLocation as any).latitude;
          const lonValue = (viewingLocation as any).longitude;
          const lat = latValue !== null && latValue !== undefined && latValue !== '' ? Number(latValue) : null;
          const lon = lonValue !== null && lonValue !== undefined && lonValue !== '' ? Number(lonValue) : null;
          const googleMapsUrl = (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) ? `https://www.google.com/maps?q=${lat},${lon}` : null;
          
          return (
            <Stack gap="lg">
              <Group gap="md">
                <Card p="sm" withBorder radius="sm" style={{ flex: 1 }}>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" fw={500} tt="uppercase">
                      {t('settings.locations.form.code')}
                    </Text>
                    <Badge variant="light" size="lg">{viewingLocation.code || '-'}</Badge>
                  </Stack>
                </Card>
                <Card p="sm" withBorder radius="sm" style={{ flex: 1 }}>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" fw={500} tt="uppercase">
                      {t('settings.locations.form.type')}
                    </Text>
                    <Badge color="blue" variant="light" size="lg">{viewingLocation.type}</Badge>
                  </Stack>
                </Card>
              </Group>
              {(viewingLocation.city || viewingLocation.country || viewingLocation.address) && (
                <Card p="md" withBorder radius="sm">
                  <Stack gap="sm">
                    {viewingLocation.city && (
                      <Group gap="xs">
                        <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 100 }}>
                          {t('settings.locations.form.city')}:
                        </Text>
                        <Text>{viewingLocation.city}</Text>
                      </Group>
                    )}
                    {viewingLocation.country && (
                      <Group gap="xs">
                        <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 100 }}>
                          {t('settings.locations.form.country')}:
                        </Text>
                        <Text>{viewingLocation.country}</Text>
                      </Group>
                    )}
                    {viewingLocation.address && (
                      <Group gap="xs" align="flex-start">
                        <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 100 }}>
                          {t('settings.locations.form.address')}:
                        </Text>
                        <Text style={{ flex: 1 }}>{viewingLocation.address}</Text>
                      </Group>
                    )}
                  </Stack>
                </Card>
              )}
              {viewingLocation.description && (
                <Card p="md" withBorder radius="sm">
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed" fw={500} tt="uppercase">
                      {t('settings.locations.form.description')}
                    </Text>
                    <Text>{viewingLocation.description}</Text>
                  </Stack>
                </Card>
              )}
              {(lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) && (
                <Card p="md" withBorder radius="sm">
                  <Stack gap="sm">
                    <Text size="sm" c="dimmed" fw={500} tt="uppercase" mb="xs">
                      {t('settings.locations.map.description')}
                    </Text>
                    <Group gap="xs" wrap="wrap">
                      <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 80 }}>
                        {t('settings.locations.map.latitude')}:
                      </Text>
                      <Text size="sm">{lat.toFixed(6)}</Text>
                    </Group>
                    <Group gap="xs" wrap="wrap">
                      <Text size="sm" c="dimmed" fw={500} style={{ minWidth: 80 }}>
                        {t('settings.locations.map.longitude')}:
                      </Text>
                      <Text size="sm">{lon.toFixed(6)}</Text>
                    </Group>
                    {googleMapsUrl && (
                      <Group mt="sm">
                        <Anchor
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="sm"
                          c="blue"
                          fw={500}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <IconExternalLink size={16} />
                          {t('settings.locations.map.openInGoogleMaps')}
                        </Anchor>
                      </Group>
                    )}
                  </Stack>
                </Card>
              )}
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setShowDetailModal(false)}>
                  {t('settings.locations.close')}
                </Button>
                <Button onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(viewingLocation);
                }}>
                  {t('settings.locations.edit')}
                </Button>
              </Group>
            </Stack>
          );
        })()}
      </Modal>
    </>
  );
});

LocationsPageClientComponent.displayName = 'LocationsPageClient';

export const LocationsPageClient = LocationsPageClientComponent;

