import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import type {
  AnalyzeResponse,
  RouteRiskSegment
} from '../services/api';
import { processRouteGeometry } from '../domain/RouteGeometryProcessor';
import SegmentWeatherPopup from './SegmentWeatherPopup';
import MapFeedbackPanels from './MapFeedbackPanels';

type LatLng = [number, number];

interface MapViewProps {
  apiResponse: AnalyzeResponse | null;
}

interface RouteBoundsControllerProps {
  coordinates: LatLng[];
}

const SHOW_SEGMENT_BOUNDARY_MARKERS = true;

interface MapClickControllerProps {
  onClearSelection: () => void;
}

const getSegmentColor = (
  riskLevel: RouteRiskSegment['RiskLevel']
): string => {
  switch (riskLevel) {
    case 'High':
      return '#ef4444';

    case 'Moderate':
      return '#eab308';

    case 'Low':
    default:
      return '#22c55e';
  }
};

const getSegmentKey = (
  segment: RouteRiskSegment
): string => {
  return (
    `${segment.StartCoordinateIndex}-` +
    `${segment.EndCoordinateIndex}`
  );
};

const formatDistance = (meters: number): string => {
  return `${Math.round(meters / 1000)} km`;
};

function RouteBoundsController({
  coordinates
}: RouteBoundsControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length < 2) {
      return;
    }

    const bounds = L.latLngBounds(coordinates);

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14
    });
  }, [coordinates, map]);

  return null;
}

function MapClickController({
  onClearSelection
}: MapClickControllerProps) {
  useMapEvents({
    click: () => {
      onClearSelection();
    }
  });

  return null;
}

export default function MapView({
  apiResponse
}: MapViewProps) {
  const { t } = useTranslation();

  const [selectedSegmentKey, setSelectedSegmentKey] =
    useState<string | null>(null);

  const {
    hasRouteData,
    hasSegments,
    latlngs,
    start,
    end,
    centerLat,
    centerLng,
    zoom,
    routeSegments
  } = processRouteGeometry(apiResponse);

  useEffect(() => {
    setSelectedSegmentKey(null);
  }, [apiResponse]);

  const startIcon = useMemo(
    () =>
      L.icon({
        iconUrl:
          'https://cdn-icons-png.flaticon.com/512/9356/9356230.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: 'pulse-animation'
      }),
    []
  );

  const endIcon = useMemo(
    () =>
      L.icon({
        iconUrl:
          'https://cdn-icons-png.flaticon.com/512/9800/9800512.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: 'bounce-animation'
      }),
    []
  );

  const handleSegmentClick = (
    segment: RouteRiskSegment
  ): void => {
    const segmentKey = getSegmentKey(segment);

    setSelectedSegmentKey(currentKey =>
      currentKey === segmentKey
        ? null
        : segmentKey
    );
  };

  return (
    <div className="relative h-[calc(100vh-72px)] w-full">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url={`https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <ZoomControl position="bottomright" />

        <MapClickController
          onClearSelection={() => {
            setSelectedSegmentKey(null);
          }}
        />

        {hasRouteData && (
          <RouteBoundsController coordinates={latlngs} />
        )}

        {hasRouteData &&
          !hasSegments &&
          latlngs.length > 0 && (
            <Polyline
              positions={latlngs}
              pathOptions={{
                color: '#193A84',
                weight: 6,
                opacity: 0.9
              }}
            />
          )}

        {hasRouteData &&
          hasSegments &&
          routeSegments.map(segment => {
            const segmentKey = getSegmentKey(
              segment.data
            );

            const isSelected =
              selectedSegmentKey === segmentKey;

            const hasSelectedSegment =
              selectedSegmentKey !== null;

            return (
              <Polyline
                key={segmentKey}
                positions={segment.coords}
                pathOptions={{
                  color: getSegmentColor(
                    segment.data.RiskLevel
                  ),
                  weight: isSelected ? 11 : 7,
                  opacity:
                    hasSelectedSegment && !isSelected
                      ? 0.2
                      : 0.9,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
                eventHandlers={{
                  click: event => {
                    L.DomEvent.stopPropagation(
                      event.originalEvent
                    );

                    handleSegmentClick(segment.data);
                  },
                  popupclose: () => {
                    setSelectedSegmentKey(null);
                  }
                }}
              >
                <SegmentWeatherPopup
                  segmentData={segment.data}
                />
              </Polyline>
            );
          })}

        {SHOW_SEGMENT_BOUNDARY_MARKERS && hasRouteData &&
          hasSegments &&
          routeSegments
            .slice(0, -1)
            .map(segment => {
              const segmentKey = getSegmentKey(
                segment.data
              );

              const boundaryPosition =
                latlngs[
                  segment.data.EndCoordinateIndex
                ];

              if (!boundaryPosition) {
                return null;
              }

              const isSelected =
                selectedSegmentKey === segmentKey;

              return (
                <CircleMarker
                  key={`boundary-${segmentKey}`}
                  center={boundaryPosition}
                  radius={isSelected ? 4 : 3}
                  pathOptions={{
                    color: isSelected
                      ? getSegmentColor(
                          segment.data.RiskLevel
                        )
                      : '#ffffff',
                    fillColor: '#111827',
                    fillOpacity: 0.85,
                    opacity: 1,
                    weight: isSelected ? 2 : 1
                  }}
                  eventHandlers={{
                    click: event => {
                      L.DomEvent.stopPropagation(
                        event.originalEvent
                      );

                      setSelectedSegmentKey(
                        segmentKey
                      );
                    },
                    popupclose: () => {
                      setSelectedSegmentKey(null);
                    }
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -6]}
                    opacity={0.95}
                  >
                    {formatDistance(
                      segment.data.EndDistanceMeters
                    )}
                  </Tooltip>

                  <SegmentWeatherPopup
                    segmentData={segment.data}
                  />
                </CircleMarker>
              );
            })}

        {apiResponse && start && (
          <Marker
            position={start}
            icon={startIcon}
          >
            <Popup>
              <div className="text-center font-medium">
                <span className="text-lg text-green-600">
                  🚩 {t('map.origin')}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {apiResponse && end && (
          <Marker
            position={end}
            icon={endIcon}
          >
            <Popup>
              <div className="text-center font-medium">
                <span className="text-lg text-red-600">
                  🏁 {t('map.destination')}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <MapFeedbackPanels
        apiResponse={apiResponse}
        hasRouteData={hasRouteData}
        hasSegments={hasSegments}
      />
    </div>
  );
}