'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Paper, Button, Group, Badge, Text, Stack, Loader, Alert, ScrollArea, Modal, Divider } from '@mantine/core';
import { IconBuilding, IconHome, IconAlertCircle } from '@tabler/icons-react';
import { useProperties } from '@/hooks/useProperties';
import { useApartments } from '@/hooks/useApartments';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Property } from '@/modules/real-estate/types/property';
import type { Apartment } from '@/modules/real-estate/types/apartment';
import styles from './PropertyMap.module.css';

// Mapbox components (only loaded if needed)
const MapboxMap = dynamic(() => import('react-map-gl/mapbox').then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader />
    </div>
  ),
}) as any;

const MapboxMarker = dynamic(() => import('react-map-gl/mapbox').then((mod) => mod.Marker), { ssr: false }) as any;

// Leaflet components (only loaded if needed)
const LeafletMap = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false }) as any;
const LeafletTileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false }) as any;
const LeafletMarker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false }) as any;

interface PropertyMapProps {
  locale: string;
  propertyId?: string;
  apartmentId?: string;
  onPropertyClick?: (property: Property) => void;
  onApartmentClick?: (apartment: Apartment) => void;
}

interface ModuleSettings {
  mapProvider?: string;
  mapboxAccessToken?: string;
}

export function PropertyMap({ locale, propertyId, apartmentId, onPropertyClick, onApartmentClick }: PropertyMapProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const [cssLoaded, setCssLoaded] = useState(false);
  const [moduleSettings, setModuleSettings] = useState<ModuleSettings>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [leafletLib, setLeafletLib] = useState<any>(null);
  const [geocodedProperties, setGeocodedProperties] = useState<Map<string, { latitude: number; longitude: number }>>(new Map());
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [modalProperty, setModalProperty] = useState<Property | null>(null);
  const [isHoveringModal, setIsHoveringModal] = useState(false);

  // Load module settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/modules/real-estate/settings');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const settings: ModuleSettings = {};
            result.data.forEach((setting: any) => {
              if (setting.key === 'mapProvider' || setting.key === 'mapboxAccessToken') {
                (settings as Record<string, any>)[setting.key] = setting.value || setting.defaultValue;
              }
            });
            setModuleSettings(settings);
          }
        }
      } catch (error) {
        console.error('Failed to load module settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const mapProvider = moduleSettings.mapProvider || 'openstreetmap';
  const mapboxToken = moduleSettings.mapboxAccessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Load CSS dynamically based on provider
  useEffect(() => {
    if (typeof window !== 'undefined' && !cssLoaded) {
      if (mapProvider === 'mapbox') {
      const linkId = 'mapbox-gl-css';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        document.head.appendChild(link);
        }
      } else {
        // Leaflet CSS
        const linkId = 'leaflet-css';
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }
        // Inject CSS animations for markers
        const styleId = 'marker-animations';
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes pulse-ring {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
              100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }
      }
      setCssLoaded(true);
    }
  }, [mapProvider, cssLoaded]);

  const [viewState, setViewState] = useState({
    longitude: 29.0,
    latitude: 41.0,
    zoom: 10,
  });

  // Fetch properties
  const { data: propertiesData, isLoading: isLoadingProperties } = useProperties({ page: 1, pageSize: 1000 });
  const { data: apartmentsData, isLoading: isLoadingApartments } = useApartments({ page: 1, pageSize: 1000 });

  // Filter properties and apartments
  const properties = useMemo(() => {
    if (!propertiesData?.properties) return [];
    let filtered = propertiesData.properties;
    if (propertyId) {
      filtered = filtered.filter(p => p.id === propertyId);
    }
    
    // Merge geocoded coordinates with properties
    const withLocation = filtered
      .map((property) => {
        const geocoded = geocodedProperties.get(property.id);
        return {
          ...property,
          latitude: property.latitude || geocoded?.latitude || null,
          longitude: property.longitude || geocoded?.longitude || null,
        };
      })
      .filter((p) => p.latitude && p.longitude);
    
    return withLocation;
  }, [propertiesData, propertyId, geocodedProperties]);

  const apartments = useMemo(() => {
    if (!apartmentsData?.apartments) return [];
    let filtered = apartmentsData.apartments;
    if (apartmentId) {
      filtered = filtered.filter(a => a.id === apartmentId);
    }
    if (propertyId) {
      filtered = filtered.filter(a => a.propertyId === propertyId);
    }
    const withLocation = filtered.map(apartment => {
      const propertyFromRelation = (apartment as any).property;
      const propertyFromArray = properties.find(p => p.id === apartment.propertyId);
      
      return {
        ...apartment,
        latitude: propertyFromRelation?.latitude || propertyFromArray?.latitude || null,
        longitude: propertyFromRelation?.longitude || propertyFromArray?.longitude || null,
      };
    }).filter(a => a.latitude && a.longitude);
    
    return withLocation;
  }, [apartmentsData, apartmentId, propertyId, properties]);

  // Set initial view to first property or default
  useEffect(() => {
    if (properties.length > 0 && !propertyId) {
      const firstProperty = properties[0];
      if (firstProperty?.latitude && firstProperty.longitude) {
        setViewState(prev => {
          const newLon = Number(firstProperty?.longitude);
          const newLat = Number(firstProperty?.latitude);
          // Only update if different to prevent unnecessary re-renders
          if (prev.longitude !== newLon || prev.latitude !== newLat) {
            return {
              longitude: newLon,
              latitude: newLat,
          zoom: 12,
            };
          }
          return prev;
        });
      }
    }
  }, [properties.length, propertyId]);

  // Geocoding helper function
  const geocodeAddress = useCallback(async (address: string, city?: string, district?: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const cleanAddress = address
        .replace(/No:\s*\d+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      const searchQueries = [
        district && city ? `${cleanAddress}, ${district}, ${city}, Turkey` : null,
        city ? `${cleanAddress}, ${city}, Turkey` : null,
        district && city ? `${district}, ${city}, Turkey` : null,
        city ? `${city}, Turkey` : null,
      ].filter(Boolean) as string[];

      for (const query of searchQueries) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=tr&addressdetails=1`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Omnex-SaaS-Platform/1.0',
          },
        });

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data && data.length > 0) {
          return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('[PropertyMap] Geocoding error:', error);
      return null;
    }
  }, []);

  // Save geocoded coordinates to database
  const saveGeocodedCoordinates = useCallback(async (propertyId: string, latitude: number, longitude: number) => {
    try {
      const response = await fetch(`/api/real-estate/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        console.error('[PropertyMap] Failed to save coordinates:', await response.text());
      }
    } catch (error) {
      console.error('[PropertyMap] Error saving coordinates:', error);
    }
  }, []);

  // Geocode properties without coordinates
  useEffect(() => {
    if (!propertiesData?.properties || geocodingInProgress) return;

    const propertiesWithoutCoords = propertiesData.properties.filter(
      (p) => !p.latitude || !p.longitude
    );

    if (propertiesWithoutCoords.length === 0) return;

    const needsGeocoding = propertiesWithoutCoords.filter(
      (p) => !geocodedProperties.has(p.id)
    );

    if (needsGeocoding.length === 0) return;

    setGeocodingInProgress(true);
    
    const geocodePromises = needsGeocoding.map((property, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          const coords = await geocodeAddress(
            property.address,
            property.city,
            property.district || undefined
          );
          
          if (coords) {
            setGeocodedProperties((prev) => {
              const newMap = new Map(prev);
              newMap.set(property.id, coords);
              return newMap;
            });
            
            await saveGeocodedCoordinates(property.id, coords.latitude, coords.longitude);
          }
          resolve();
        }, index * 1000);
      });
    });

    Promise.all(geocodePromises).then(() => {
      setGeocodingInProgress(false);
    });
  }, [propertiesData?.properties, geocodeAddress, geocodingInProgress, saveGeocodedCoordinates, geocodedProperties]);

  // Load Leaflet library for OpenStreetMap
  useEffect(() => {
    if (typeof window !== 'undefined' && mapProvider === 'openstreetmap' && !leafletLoaded) {
      import('leaflet').then((L) => {
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        setLeafletLib(L.default);
        setLeafletLoaded(true);
      });
    }
  }, [mapProvider, leafletLoaded]);

  // Track mouse position globally for modal positioning
  useEffect(() => {
    if (!modalProperty) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Mouse position tracking removed - not used
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [modalProperty]);

  // Memoize property apartments to prevent unnecessary recalculations
  // MUST be before any early returns to follow Rules of Hooks
  const propertyApartments = useMemo(() => {
    if (!modalProperty) return [];
    return apartments.filter(a => a.propertyId === modalProperty.id);
  }, [modalProperty?.id, apartments]);

  if (loadingSettings || isLoadingProperties || isLoadingApartments || !cssLoaded) {
    return (
      <Paper shadow="xs" p="md" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack align="center" gap="md">
          <Loader />
          <Text c="dimmed">{tGlobal('loading')}</Text>
        </Stack>
      </Paper>
    );
  }

  if (geocodingInProgress) {
    return (
      <Paper shadow="xs" p="md" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack align="center" gap="md">
        <Loader />
          <Text c="dimmed">
            {t('map.geocodingInProgress')}
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (mapProvider === 'mapbox' && !mapboxToken) {
  return (
      <Paper shadow="xs" p="md">
        <Alert icon={<IconAlertCircle size={16} />} title={t('map.mapboxTokenMissing')} color="yellow">
          <Text mb="md">
            {t('map.mapboxTokenMissingDescription')}
          </Text>
          <Button
            variant="light"
            onClick={() => router.push(`/${locale}/modules/real-estate/settings`)}
          >
            {t('map.goToSettings')}
          </Button>
        </Alert>
      </Paper>
    );
  }

  // Render Mapbox map
  if (mapProvider === 'mapbox') {
    return (
      <>
    <Paper shadow="xs" p="md">
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
            <MapboxMap
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
          mapboxAccessToken={mapboxToken}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
        >
          {/* Property Markers */}
          {properties.map((property) => {
            if (!property.latitude || !property.longitude) return null;
            return (
                  <MapboxMarker
                key={`property-${property.id}`}
                longitude={Number(property.longitude)}
                latitude={Number(property.latitude)}
                anchor="bottom"
              >
                <div
                      className={styles.mapboxMarkerWrapper}
                      onMouseEnter={(e) => {
                        if (modalProperty?.id !== property.id) {
                          setModalProperty(property);
                        }
                      }}
                      onMouseMove={(e) => {
                        // Mouse position tracking removed
                      }}
                      onMouseLeave={() => {
                        setTimeout(() => {
                          if (!isHoveringModal) {
                            setModalProperty(null);
                          }
                        }, 150);
                      }}
                      onClick={() => {
                        if (onPropertyClick) onPropertyClick(property);
                      }}
                    >
                      <div className={styles.mapboxPulseRing} style={{ color: '#fa5252' }} />
                      <div className={styles.mapboxMarkerIcon}>
                        <IconBuilding size={32} color="#fa5252" stroke={2} />
                      </div>
                </div>
                  </MapboxMarker>
            );
          })}

          {/* Apartment Markers */}
          {apartments.map((apartment) => {
            if (!apartment.latitude || !apartment.longitude) return null;
            const statusColor = apartment.status === 'rented' ? '#51cf66' : apartment.status === 'empty' ? '#ffd43b' : '#ff6b6b';
                const property = properties.find(p => p.id === apartment.propertyId);
                
            return (
                  <MapboxMarker
                key={`apartment-${apartment.id}`}
                longitude={Number(apartment.longitude)}
                latitude={Number(apartment.latitude)}
                anchor="bottom"
              >
                <div
                      className={styles.mapboxMarkerWrapper}
                      onMouseEnter={(e) => {
                        if (property && modalProperty?.id !== property.id) {
                          setModalProperty(property);
                        }
                      }}
                      onMouseMove={(e) => {
                        // Mouse position tracking removed
                      }}
                      onMouseLeave={() => {
                        setTimeout(() => {
                          if (!isHoveringModal) {
                            setModalProperty(null);
                          }
                        }, 150);
                      }}
                      onClick={() => {
                        if (property && onPropertyClick) onPropertyClick(property);
                        if (onApartmentClick) onApartmentClick(apartment);
                      }}
                    >
                      <div className={styles.mapboxPulseRing} style={{ color: statusColor }} />
                      <div className={styles.mapboxMarkerIcon}>
                        <IconHome size={24} color={statusColor} stroke={2} />
                      </div>
                </div>
                  </MapboxMarker>
            );
          })}
            </MapboxMap>
          </div>
        </Paper>

        {/* Property Detail Modal */}
        <Modal
          opened={!!modalProperty}
          onClose={() => {
            setModalProperty(null);
            setIsHoveringModal(false);
          }}
          title={modalProperty?.name}
          onMouseEnter={() => setIsHoveringModal(true)}
          onMouseLeave={() => {
            setIsHoveringModal(false);
            setTimeout(() => {
              if (!isHoveringModal) {
                setModalProperty(null);
              }
            }, 200);
          }}
        >
          {modalProperty && (
            <Stack gap="md">
              <div>
                <Text c="dimmed" mb="xs">{t('table.address')}</Text>
                <Text>{modalProperty.address}</Text>
                {modalProperty.city && (
                  <Text c="dimmed">{modalProperty.district ? `${modalProperty.district}, ` : ''}{modalProperty.city}</Text>
                )}
              </div>

              <Group gap="xs">
                <Badge color="blue">{modalProperty.type}</Badge>
                <Badge color={modalProperty.isActive ? 'green' : 'gray'}>
                  {modalProperty.isActive ? t('status.active') : t('status.inactive')}
                </Badge>
              </Group>

              {propertyApartments.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <Text fw={500} mb="xs">
                      {t('apartments.title')} ({propertyApartments.length})
                    </Text>
                    <ScrollArea h={200} offsetScrollbars>
                      <Stack gap="xs" style={{ paddingRight: '8px' }}>
                        {propertyApartments.map((apartment) => (
                          <div
                            key={apartment.id}
                            style={{
                              cursor: 'pointer',
                              padding: '6px 8px',
                              border: '1px solid var(--mantine-color-gray-3)',
                              borderRadius: '4px',
                              backgroundColor: 'var(--mantine-color-body)',
                              minWidth: 0,
                            }}
                            onClick={() => {
                              router.push(`/${locale}/modules/real-estate/apartments/${apartment.id}`);
                              setModalProperty(null);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--mantine-color-body)';
                            }}
                          >
                            <Group justify="space-between" gap="xs" wrap="nowrap">
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <Text fw={500} lineClamp={1}>
                                  {t('table.unitNumber')} {apartment.unitNumber}
                                </Text>
                                {apartment.floor && (
                                  <Text c="dimmed" lineClamp={1}>
                                    {t('apartments.floor')} {apartment.floor}
                                  </Text>
                                )}
                              </div>
                              <Badge
                                color={
                                  apartment.status === 'rented' ? 'green' :
                                  apartment.status === 'empty' ? 'yellow' :
                                  apartment.status === 'maintenance' ? 'orange' : 'red'
                                }
                                style={{ flexShrink: 0 }}
                              >
                                {t(`apartments.status.${apartment.status}`) || apartment.status}
                    </Badge>
                  </Group>
                          </div>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </div>
                </>
              )}

              <Group justify="flex-end" mt="md">
                  <Button
                  variant="light"
                  onClick={() => {
                    router.push(`/${locale}/modules/real-estate/properties/${modalProperty.id}`);
                    setModalProperty(null);
                  }}
                  >
                    {t('actions.viewDetails')}
                  </Button>
              </Group>
                </Stack>
          )}
        </Modal>
      </>
    );
  }

  // Render Leaflet/OpenStreetMap
  if (!leafletLoaded) {
    return (
      <Paper shadow="xs" p="md" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </Paper>
    );
  }

  return (
    <>
      <Paper shadow="xs" p="md">
        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
          <LeafletMap
            center={[viewState.latitude, viewState.longitude]}
            zoom={viewState.zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <LeafletTileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Property Markers */}
            {properties.map((property) => {
              if (!property.latitude || !property.longitude || !leafletLib) return null;
              const iconColor = '#fa5252';
              const iconSize = 32;
              
              const customIcon = leafletLib.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${iconSize}px; height: ${iconSize}px; cursor: pointer;">
                    <div style="position: absolute; top: 50%; left: 50%; width: ${iconSize * 2}px; height: ${iconSize * 2}px; border-radius: 50%; border: 2px solid ${iconColor}; opacity: 0; animation: pulse-ring 2s ease-out infinite; transform: translate(-50%, -50%); z-index: 1;"></div>
                    <div style="position: relative; z-index: 2; animation: pulse 2s ease-in-out infinite; color: ${iconColor};">
                      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                  </div>
                `,
                iconSize: [iconSize, iconSize],
                iconAnchor: [iconSize / 2, iconSize],
              });

              return (
                <LeafletMarker
                  key={`property-${property.id}`}
                  position={[Number(property.latitude), Number(property.longitude)]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => {
                      if (onPropertyClick) onPropertyClick(property);
                    },
                    mouseover: () => {
                      if (modalProperty?.id !== property.id) {
                        setModalProperty(property);
                      }
                    },
                    mouseout: () => {
                      setTimeout(() => {
                        if (!isHoveringModal) {
                          setModalProperty(null);
                        }
                      }, 150);
                    },
                  }}
                />
              );
            })}

            {/* Apartment Markers */}
            {apartments.map((apartment) => {
              if (!apartment.latitude || !apartment.longitude || !leafletLib) return null;
              const statusColor = apartment.status === 'rented' ? '#51cf66' : apartment.status === 'empty' ? '#ffd43b' : '#ff6b6b';
              const iconColor = statusColor;
              const iconSize = 24;
              const property = properties.find(p => p.id === apartment.propertyId);
              
              const customIcon = leafletLib.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${iconSize}px; height: ${iconSize}px; cursor: pointer;">
                    <div style="position: absolute; top: 50%; left: 50%; width: ${iconSize * 2}px; height: ${iconSize * 2}px; border-radius: 50%; border: 2px solid ${iconColor}; opacity: 0; animation: pulse-ring 2s ease-out infinite; transform: translate(-50%, -50%); z-index: 1;"></div>
                    <div style="position: relative; z-index: 2; animation: pulse 2s ease-in-out infinite; color: ${iconColor};">
                      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                  </div>
                `,
                iconSize: [iconSize, iconSize],
                iconAnchor: [iconSize / 2, iconSize],
              });

              return (
                <LeafletMarker
                  key={`apartment-${apartment.id}`}
                  position={[Number(apartment.latitude), Number(apartment.longitude)]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => {
                      if (property && onPropertyClick) onPropertyClick(property);
                      if (onApartmentClick) onApartmentClick(apartment);
                    },
                    mouseover: () => {
                      if (property && modalProperty?.id !== property.id) {
                        setModalProperty(property);
                      }
                    },
                    mouseout: () => {
                      setTimeout(() => {
                        if (!isHoveringModal) {
                          setModalProperty(null);
                        }
                      }, 150);
                    },
                  }}
                />
              );
            })}
          </LeafletMap>
        </div>
      </Paper>

      {/* Property Detail Modal */}
      <Modal
        opened={!!modalProperty}
        onClose={() => {
          setModalProperty(null);
          setIsHoveringModal(false);
        }}
        title={modalProperty?.name}
        onMouseEnter={() => setIsHoveringModal(true)}
        onMouseLeave={() => {
          setIsHoveringModal(false);
          setTimeout(() => {
            setModalProperty(null);
          }, 200);
        }}
      >
        {modalProperty && (
          <Stack gap="md">
            <div>
              <Text c="dimmed" mb="xs">Adres</Text>
              <Text>{modalProperty.address}</Text>
              {modalProperty.city && (
                <Text c="dimmed">{modalProperty.district ? `${modalProperty.district}, ` : ''}{modalProperty.city}</Text>
              )}
            </div>

            <Group gap="xs">
              <Badge color="blue">{modalProperty.type}</Badge>
              <Badge color={modalProperty.isActive ? 'green' : 'gray'}>
                {modalProperty.isActive ? t('status.active') : t('status.inactive')}
              </Badge>
                  </Group>

            {propertyApartments.length > 0 && (
              <>
                <Divider />
                <div>
                  <Text fw={500} mb="xs">
                    {t('apartments.title')} ({propertyApartments.length})
                  </Text>
                  <ScrollArea h={200} offsetScrollbars>
                    <Stack gap="xs" style={{ paddingRight: '8px' }}>
                      {propertyApartments.map((apartment) => (
                        <div
                          key={apartment.id}
                          style={{
                            cursor: 'pointer',
                            padding: '6px 8px',
                            border: '1px solid var(--mantine-color-gray-3)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--mantine-color-body)',
                            minWidth: 0,
                          }}
                          onClick={() => {
                            router.push(`/${locale}/modules/real-estate/apartments/${apartment.id}`);
                            setModalProperty(null);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--mantine-color-body)';
                          }}
                        >
                          <Group justify="space-between" gap="xs" wrap="nowrap">
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <Text fw={500} lineClamp={1}>
                                {t('table.unitNumber')} {apartment.unitNumber}
                              </Text>
                              {apartment.floor && (
                                <Text c="dimmed" lineClamp={1}>
                                  {t('apartments.floor')} {apartment.floor}
                      </Text>
                    )}
                            </div>
                            <Badge
                              color={
                                apartment.status === 'rented' ? 'green' :
                                apartment.status === 'empty' ? 'yellow' :
                                apartment.status === 'maintenance' ? 'orange' : 'red'
                              }
                              style={{ flexShrink: 0 }}
                            >
                              {t(`apartments.status.${apartment.status}`) || apartment.status}
                            </Badge>
                  </Group>
                        </div>
                      ))}
                    </Stack>
                  </ScrollArea>
                </div>
              </>
            )}

            <Group justify="flex-end" mt="md">
                  <Button
                variant="light"
                onClick={() => {
                  router.push(`/${locale}/modules/real-estate/properties/${modalProperty.id}`);
                  setModalProperty(null);
                }}
                  >
                    {t('actions.viewDetails')}
                  </Button>
            </Group>
                </Stack>
          )}
      </Modal>
    </>
  );
}
