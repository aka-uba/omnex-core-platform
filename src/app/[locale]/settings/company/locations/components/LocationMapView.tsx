'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Paper, Loader, Alert, Text, Group, Anchor, Badge } from '@mantine/core';
import { IconMapPin, IconAlertCircle, IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import dynamic from 'next/dynamic';
import type { Location } from '@/hooks/useLocations';

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
const LeafletPopup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false }) as any;

interface LocationMapViewProps {
  locations: Location[];
}

export function LocationMapView({ locations }: LocationMapViewProps) {
  const { t } = useTranslation('global');
  const [cssLoaded, setCssLoaded] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [leafletLib, setLeafletLib] = useState<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isContainerVisible, setIsContainerVisible] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
  const mapProvider = mapboxToken ? 'mapbox' : 'openstreetmap';

  // Load CSS dynamically based on provider (exact same as PropertyMap)
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

  // Filter locations with coordinates (exact same logic as PropertyMap)
  const locationsWithCoords = useMemo(() => {
    return locations
      .filter((loc) => {
        const lat = (loc as any).latitude;
        const lon = (loc as any).longitude;
        return lat && lon && !isNaN(Number(lat)) && !isNaN(Number(lon));
      })
      .map((loc) => ({
        ...loc,
        latitude: Number((loc as any).latitude),
        longitude: Number((loc as any).longitude),
      }));
  }, [locations]);

  // Set initial view to first location or default (exact same as PropertyMap)
  useEffect(() => {
    if (locationsWithCoords.length > 0) {
      const firstLocation = locationsWithCoords[0];
      if (firstLocation?.latitude && firstLocation.longitude) {
        setViewState(prev => {
          const newLon = Number(firstLocation?.longitude);
          const newLat = Number(firstLocation?.latitude);
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
  }, [locationsWithCoords.length]);

  // Load Leaflet library for OpenStreetMap (exact same as PropertyMap)
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


  // Invalidate Leaflet map size after render (fixes gray area issue)
  // This effect runs whenever the map should be re-rendered and container is visible
  useEffect(() => {
    if (mapProvider === 'openstreetmap' && leafletLoaded && locationsWithCoords.length > 0 && isContainerVisible) {
      // Wait for map to be fully rendered in DOM
      const timer = setTimeout(() => {
        // Find the Leaflet map container
        const mapContainer = document.querySelector('.leaflet-container');
        if (mapContainer) {
          // Get the map instance using Leaflet's internal registry
          const mapId = (mapContainer as any)._leaflet_id;
          if (mapId && leafletLib) {
            // Access map through Leaflet's global registry
            const map = (leafletLib as any).maps?.[mapId];
            if (map && typeof map.invalidateSize === 'function') {
              map.invalidateSize();
            }
          }
          // Fallback: dispatch resize event to trigger Leaflet's auto-resize
          window.dispatchEvent(new Event('resize'));
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mapProvider, leafletLoaded, locationsWithCoords.length, viewState.latitude, viewState.longitude, leafletLib, isContainerVisible]);

  // IntersectionObserver to detect when container becomes visible (fixes tab visibility issue)
  useEffect(() => {
    if (mapContainerRef.current) {
      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsContainerVisible(true);
              // Invalidate map size when container becomes visible
              if (mapProvider === 'openstreetmap' && leafletLoaded && leafletLib) {
                setTimeout(() => {
                  const mapContainer = document.querySelector('.leaflet-container');
                  if (mapContainer) {
                    const mapId = (mapContainer as any)._leaflet_id;
                    if (mapId && leafletLib) {
                      const map = (leafletLib as any).maps?.[mapId];
                      if (map && typeof map.invalidateSize === 'function') {
                        map.invalidateSize();
                      }
                    }
                  }
                }, 200);
              } else if (mapProvider === 'mapbox' && mapInstanceRef.current) {
                // Mapbox resize
                setTimeout(() => {
                  if (mapInstanceRef.current && typeof mapInstanceRef.current.resize === 'function') {
                    mapInstanceRef.current.resize();
                  }
                }, 200);
              }
            } else {
              setIsContainerVisible(false);
            }
          });
        },
        {
          threshold: 0.1, // Trigger when at least 10% of container is visible
        }
      );

      intersectionObserver.observe(mapContainerRef.current);

      return () => {
        intersectionObserver.disconnect();
      };
    }
    return undefined;
  }, [mapProvider, leafletLoaded, leafletLib]);

  // ResizeObserver to detect container size changes (fixes tab visibility issue)
  useEffect(() => {
    if (mapContainerRef.current && isContainerVisible) {
      const resizeObserver = new ResizeObserver(() => {
        if (mapProvider === 'openstreetmap' && leafletLoaded && leafletLib) {
          // Find the Leaflet map container
          const mapContainer = document.querySelector('.leaflet-container');
          if (mapContainer) {
            const mapId = (mapContainer as any)._leaflet_id;
            if (mapId && leafletLib) {
              const map = (leafletLib as any).maps?.[mapId];
              if (map && typeof map.invalidateSize === 'function') {
                // Use a small delay to ensure container is fully visible
                setTimeout(() => {
                  map.invalidateSize();
                }, 100);
              }
            }
          }
        } else if (mapProvider === 'mapbox' && mapInstanceRef.current) {
          // Mapbox resize
          setTimeout(() => {
            if (mapInstanceRef.current && typeof mapInstanceRef.current.resize === 'function') {
              mapInstanceRef.current.resize();
            }
          }, 100);
        }
      });

      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
    return undefined;
  }, [mapProvider, leafletLoaded, leafletLib, isContainerVisible]);

  if (!cssLoaded) {
    return (
      <Paper shadow="xs" p="md" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </Paper>
    );
  }

  if (mapProvider === 'mapbox' && !mapboxToken) {
    return (
      <Paper shadow="xs" p="md">
        <Alert icon={<IconAlertCircle size={16} />} title={t('settings.locations.map.title')} color="yellow">
          <Text mb="md">
            {t('settings.locations.map.noLocations')}
          </Text>
        </Alert>
      </Paper>
    );
  }

  if (locationsWithCoords.length === 0) {
    return (
      <Paper shadow="xs" p="md" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert icon={<IconMapPin size={16} />} title={t('settings.locations.map.title')} color="blue">
          {t('settings.locations.map.noLocations')}
        </Alert>
      </Paper>
    );
  }

  // Render Mapbox map (exact same structure as PropertyMap)
  if (mapProvider === 'mapbox') {
    return (
      <>
        <Paper shadow="xs" p="md">
          <div ref={mapContainerRef} style={{ width: '100%', height: '600px', position: 'relative' }}>
            <MapboxMap
              {...viewState}
              onMove={(evt: any) => setViewState(evt.viewState)}
              mapboxAccessToken={mapboxToken}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              onLoad={(evt: any) => {
                // Store map instance for resize operations
                if (evt.target) {
                  mapInstanceRef.current = evt.target;
                  // Resize when container becomes visible
                  if (isContainerVisible) {
                    setTimeout(() => {
                      if (evt.target && typeof evt.target.resize === 'function') {
                        evt.target.resize();
                      }
                    }, 200);
                  }
                }
              }}
            >
              {/* Location Markers */}
              {locationsWithCoords.map((location) => {
                if (!location.latitude || !location.longitude) return null;
                return (
                  <MapboxMarker
                    key={`location-${location.id}`}
                    longitude={Number(location.longitude)}
                    latitude={Number(location.latitude)}
                    anchor="bottom"
                  >
                    <IconMapPin size={32} color="#fa5252" stroke={2} fill="#fa5252" />
                  </MapboxMarker>
                );
              })}

            </MapboxMap>
          </div>
        </Paper>
      </>
    );
  }

  // Render Leaflet/OpenStreetMap (exact same structure as PropertyMap)
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
        <div ref={mapContainerRef} style={{ width: '100%', height: '600px', position: 'relative' }}>
          <LeafletMap
            center={[viewState.latitude, viewState.longitude]}
            zoom={viewState.zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            whenCreated={(map: any) => {
              if (map) {
                mapInstanceRef.current = map;
                // Invalidate size when container becomes visible
                // Use IntersectionObserver to detect visibility instead of fixed delays
                const checkAndInvalidate = () => {
                  if (mapContainerRef.current) {
                    const rect = mapContainerRef.current.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0 && 
                                     rect.top < window.innerHeight && 
                                     rect.bottom > 0;
                    if (isVisible && map && typeof map.invalidateSize === 'function') {
                      map.invalidateSize();
                    }
                  }
                };
                
                // Check immediately and after delays
                checkAndInvalidate();
                setTimeout(checkAndInvalidate, 100);
                setTimeout(checkAndInvalidate, 500);
                setTimeout(checkAndInvalidate, 1000);
              }
            }}
          >
            <LeafletTileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Location Markers */}
            {locationsWithCoords.map((location) => {
              if (!location.latitude || !location.longitude || !leafletLib) return null;
              const iconColor = '#fa5252';
              const iconSize = 32;
              // Fix closure issue by storing location in a const
              const currentLocation = { ...location };
              
              const customIcon = leafletLib.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${iconSize}px; height: ${iconSize}px; cursor: pointer;">
                    <div style="position: absolute; top: 50%; left: 50%; width: ${iconSize * 2}px; height: ${iconSize * 2}px; border-radius: 50%; border: 2px solid ${iconColor}; opacity: 0; animation: pulse-ring 2s ease-out infinite; transform: translate(-50%, -50%); z-index: 1;"></div>
                    <div style="position: relative; z-index: 2; animation: pulse 2s ease-in-out infinite; color: ${iconColor};">
                      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                  </div>
                `,
                iconSize: [iconSize, iconSize],
                iconAnchor: [iconSize / 2, iconSize],
                popupAnchor: [0, -iconSize],
              });

              return (
                <LeafletMarker
                  key={`location-${currentLocation.id}`}
                  position={[Number(currentLocation.latitude), Number(currentLocation.longitude)]}
                  icon={customIcon}
                >
                  <LeafletPopup>
                    <div style={{ minWidth: '200px' }}>
                      <Text fw={600} mb={4}>
                        {currentLocation.name}
                      </Text>
                      {currentLocation.address && (
                        <Text c="dimmed" mb={4}>
                          {currentLocation.address}
                        </Text>
                      )}
                      {currentLocation.city && (
                        <Text c="dimmed" mb={4}>
                          {currentLocation.city}
                          {currentLocation.country && `, ${currentLocation.country}`}
                        </Text>
                      )}
                      {currentLocation.parentId && (() => {
                        const parentLocation = locations.find(loc => loc.id === currentLocation.parentId);
                        return parentLocation ? (
                          <Group gap="xs" mb={4} wrap="wrap">
                            <Text c="dimmed" fw={500} style={{ minWidth: '100px' }}>
                              {t('settings.locations.form.parent')}:
                            </Text>
                            <div style={{ flex: 1 }}>
                              <Text fw={500} mb={2}>
                                {parentLocation.name}
                              </Text>
                              {parentLocation.type && (
                                <Badge color="blue" variant="light">
                                  {(() => {
                                    const typeLabels: Record<string, string> = {
                                      headquarters: t('settings.locations.types.headquarters'),
                                      branch: t('settings.locations.types.branch'),
                                      warehouse: t('settings.locations.types.warehouse'),
                                      office: t('settings.locations.types.office'),
                                      factory: t('settings.locations.types.factory'),
                                      store: t('settings.locations.types.store'),
                                      other: t('settings.locations.types.other'),
                                    };
                                    return typeLabels[parentLocation.type] || parentLocation.type;
                                  })()}
                                </Badge>
                              )}
                            </div>
                          </Group>
                        ) : null;
                      })()}
                      <Group gap="xs" mb={4}>
                        {currentLocation.type && (
                          <Badge color="blue">
                            {(() => {
                              // Alt alan için parent'ın type'ını göster
                              const displayType = currentLocation.parentId 
                                ? (locations.find(loc => loc.id === currentLocation.parentId)?.type || currentLocation.type)
                                : currentLocation.type;
                              
                              const typeLabels: Record<string, string> = {
                                headquarters: t('settings.locations.types.headquarters'),
                                branch: t('settings.locations.types.branch'),
                                warehouse: t('settings.locations.types.warehouse'),
                                office: t('settings.locations.types.office'),
                                factory: t('settings.locations.types.factory'),
                                store: t('settings.locations.types.store'),
                                other: t('settings.locations.types.other'),
                              };
                              return typeLabels[displayType] || displayType;
                            })()}
                          </Badge>
                        )}
                        <Badge color={currentLocation.isActive ? 'green' : 'gray'}>
                          {currentLocation.isActive ? (t('settings.locations.status.active')) : (t('settings.locations.status.inactive'))}
                        </Badge>
                      </Group>
                      {currentLocation.latitude && currentLocation.longitude && (
                        <>
                          <Group gap="xs" wrap="wrap" mb={4}>
                            <Text c="dimmed">
                              {t('settings.locations.map.latitude')}: {Number(currentLocation.latitude).toFixed(6)}
                            </Text>
                            <Text c="dimmed">
                              {t('settings.locations.map.longitude')}: {Number(currentLocation.longitude).toFixed(6)}
                            </Text>
                          </Group>
                          <Anchor
                            href={`https://www.google.com/maps/search/?api=1&query=${Number(currentLocation.latitude)},${Number(currentLocation.longitude)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}
                          >
                            <IconExternalLink size={14} />
                            {t('settings.locations.map.openInGoogleMaps')}
                          </Anchor>
                        </>
                      )}
                    </div>
                  </LeafletPopup>
                </LeafletMarker>
              );
            })}
          </LeafletMap>
        </div>
      </Paper>
    </>
  );
}
