import { MapContainer, TileLayer, Polyline, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

import type { AnalyzeResponse } from '../services/api';

import { processRouteGeometry } from '../domain/RouteGeometryProcessor';
import { getRiskSeverityConfig } from '../domain/RiskInterpreter';

import SegmentWeatherPopup from './SegmentWeatherPopup';
import MapFeedbackPanels from './MapFeedbackPanels';

export default function MapView({ apiResponse }: { apiResponse: AnalyzeResponse | null }) {
  const { t } = useTranslation();

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

  // Ícones customizados para a Origem e Destino
  const startIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/9356/9356230.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'pulse-animation'
  });

  const endIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/9800/9800512.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'bounce-animation'
  });

  return (
    <div className="relative w-full h-[calc(100vh-72px)]">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        scrollWheelZoom
        className="w-full h-full"
        zoomControl={false}
      >
        {/* mapa satélite */}
        {/* <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        /> */}

        {/* mapa topográfico */}
        {/* <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
          maxZoom={17}
        /> */}

        {/* original colorido */}
        {/* <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        /> */}

        {/* original */}
        <TileLayer
          url={`https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <ZoomControl position="bottomright" />

        {/* ROTA MOCK: Desenha a linha azul contínua se não houver segmentos ainda */}
        {hasRouteData && !hasSegments && latlngs.length > 0 && (
          <Polyline 
            positions={latlngs as [number, number][]} 
            pathOptions={{ color: '#193A84', weight: 6, opacity: 0.9 }} 
          />
        )}

        {/* ROTA REAL: Draw each segment with our isolated popup */}
        {hasRouteData && hasSegments && routeSegments.map((seg, i) => {
          const riskConfig = getRiskSeverityConfig(seg.data.Score);
          
          return (
            <Polyline
              key={i}
              positions={seg.coords as [number, number][]}
              pathOptions={{ color: riskConfig.hexColor, weight: 6, opacity: 0.9 }}
            >
              <SegmentWeatherPopup segmentData={seg.data} />
            </Polyline>
          );
        })}

        {/* Marcadores de Início e Fim */}
        {apiResponse && start && (
          <Marker position={start as [number, number]} icon={startIcon}>
            <Popup>
              <div className="font-medium text-center">
                <span className="text-green-600 text-lg">🚩 {t('map.origin')}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {apiResponse && end && (
          <Marker position={end as [number, number]} icon={endIcon}>
            <Popup>
              <div className="font-medium text-center">
                <span className="text-red-600 text-lg">🏁 {t('map.destination')}</span>
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