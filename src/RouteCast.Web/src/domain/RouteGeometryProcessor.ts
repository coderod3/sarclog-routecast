import type { AnalyzeResponse } from '../services/api';

// Interface que define o formato exato que o mapa precisa para desenhar os segmentos
export interface RouteSegmentData {
  coords: [number, number][];
  data: AnalyzeResponse['Segments'][0];
}

// Interface com todos os dados processados e prontos para a interface (UI)
export interface ProcessedRoute {
  hasRouteData: boolean;
  hasSegments: boolean;
  latlngs: [number, number][];
  start: [number, number] | null;
  end: [number, number] | null;
  centerLat: number;
  centerLng: number;
  zoom: number;
  routeSegments: RouteSegmentData[];
}

// Coordenadas padrao do mapa
const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];
const DEFAULT_ZOOM = 7;

/**
 * Processa o AnalyzeResponse bruto da API e o transforma em dados geométricos 
 */
export const processRouteGeometry = (apiResponse: AnalyzeResponse | null): ProcessedRoute => {
  let routeData: any = null;
  try {
    if (apiResponse?.Coordinates) {
      if (typeof apiResponse.Coordinates === 'string' && apiResponse.Coordinates !== "{}") {
        routeData = JSON.parse(apiResponse.Coordinates);
      } else if (typeof apiResponse.Coordinates === 'object') {
        routeData = apiResponse.Coordinates; // Se já vier como objeto, aceita direto
      }
    }
  } catch (error) {
    console.error("Erro ao decodificar as coordenadas da rota:", error);
  }

  const hasRouteData = !!routeData && !!routeData.features && routeData.features.length > 0;
  const hasSegments = !!apiResponse?.Segments && apiResponse.Segments.length > 0;

  // Lendo as coordenadas diretamente do GeoJSON e invertendo [lon, lat] para [lat, lon]
  const latlngs: [number, number][] = hasRouteData 
    ? routeData.features[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]) 
    : [];

  // Identificando Início e Fim
  const start = latlngs.length > 0 ? latlngs[0] : null;
  const end = latlngs.length > 0 ? latlngs[latlngs.length - 1] : null;

  // Calculando o Centro da Câmera e o Zoom
  const centerLat = start ? start[0] : DEFAULT_CENTER[0];
  const centerLng = start ? start[1] : DEFAULT_CENTER[1];
  const zoom = hasRouteData ? 7 : DEFAULT_ZOOM;

  // Fatiando os segmentos de risco (baseado nos índices enviados pelo backend)
  const routeSegments: RouteSegmentData[] = hasSegments && apiResponse ? apiResponse.Segments.map((segment) => {
    const startIdx = segment.Index;
    const endIdx = segment.Index === apiResponse.Segments.length - 1
      ? latlngs.length
      : apiResponse.Segments[segment.Index + 1]?.Index || latlngs.length;

    return {
      coords: latlngs.slice(startIdx, endIdx),
      data: segment
    };
  }) : [];

  return {
    hasRouteData,
    hasSegments,
    latlngs,
    start,
    end,
    centerLat,
    centerLng,
    zoom,
    routeSegments
  };
};