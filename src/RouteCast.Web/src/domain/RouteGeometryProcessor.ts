import type {
  AnalyzeResponse,
  RouteRiskSegment
} from '../services/api';

type LatLng = [number, number];

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}

export interface RouteSegmentData {
  coords: LatLng[];
  data: RouteRiskSegment;
}

export interface ProcessedRoute {
  hasRouteData: boolean;
  hasSegments: boolean;
  latlngs: LatLng[];
  start: LatLng | null;
  end: LatLng | null;
  centerLat: number;
  centerLng: number;
  zoom: number;
  routeSegments: RouteSegmentData[];
}

const DEFAULT_CENTER: LatLng = [-23.5505, -46.6333];
const DEFAULT_ZOOM = 7;

export const processRouteGeometry = (
  apiResponse: AnalyzeResponse | null
): ProcessedRoute => {
  const routeData = parseRouteData(apiResponse?.Coordinates);

  const latlngs = extractCoordinates(routeData);

  const start = latlngs.length > 0
    ? latlngs[0]
    : null;

  const end = latlngs.length > 0
    ? latlngs[latlngs.length - 1]
    : null;

  const routeSegments = apiResponse
    ? createRouteSegments(
        latlngs,
        apiResponse.Segments
      )
    : [];

  const hasRouteData = latlngs.length > 0;
  const hasSegments = routeSegments.length > 0;

  return {
    hasRouteData,
    hasSegments,
    latlngs,
    start,
    end,
    centerLat: start?.[0] ?? DEFAULT_CENTER[0],
    centerLng: start?.[1] ?? DEFAULT_CENTER[1],
    zoom: hasRouteData ? 7 : DEFAULT_ZOOM,
    routeSegments
  };
};

const parseRouteData = (
  coordinates: string | null | undefined
): GeoJsonFeatureCollection | null => {
  if (!coordinates || coordinates === '{}') {
    return null;
  }

  try {
    const parsedData: unknown = JSON.parse(coordinates);

    if (!isGeoJsonFeatureCollection(parsedData)) {
      console.error(
        'A geometria recebida não possui o formato GeoJSON esperado.'
      );

      return null;
    }

    return parsedData;
  } catch (error) {
    console.error(
      'Erro ao decodificar as coordenadas da rota:',
      error
    );

    return null;
  }
};

const extractCoordinates = (
  routeData: GeoJsonFeatureCollection | null
): LatLng[] => {
  if (!routeData || routeData.features.length === 0) {
    return [];
  }

  const feature = routeData.features[0];

  if (
    !feature ||
    feature.geometry.type !== 'LineString'
  ) {
    return [];
  }

  return feature.geometry.coordinates
    .filter(isValidGeoJsonCoordinate)
    .map((coordinate): LatLng => [
      coordinate[1],
      coordinate[0]
    ]);
};

const createRouteSegments = (
  latlngs: LatLng[],
  segments: RouteRiskSegment[]
): RouteSegmentData[] => {
  if (latlngs.length === 0 || segments.length === 0) {
    return [];
  }

  return segments
    .map((segment): RouteSegmentData | null => {
      const startIndex = Math.max(
        0,
        segment.StartCoordinateIndex
      );

      const endIndex = Math.min(
        latlngs.length - 1,
        segment.EndCoordinateIndex
      );

      if (
        startIndex >= latlngs.length ||
        endIndex < startIndex
      ) {
        console.error(
          'Segmento com índices inválidos:',
          segment
        );

        return null;
      }

      const segmentCoordinates = latlngs.slice(
        startIndex,
        endIndex + 1
      );

      if (segmentCoordinates.length < 2) {
        return null;
      }

      return {
        coords: segmentCoordinates,
        data: segment
      };
    })
    .filter(
      (
        segment
      ): segment is RouteSegmentData => segment !== null
    );
};

const isGeoJsonFeatureCollection = (
  value: unknown
): value is GeoJsonFeatureCollection => {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const candidate = value as Partial<GeoJsonFeatureCollection>;

  return (
    candidate.type === 'FeatureCollection' &&
    Array.isArray(candidate.features)
  );
};

const isValidGeoJsonCoordinate = (
  coordinate: number[]
): boolean => {
  if (
    !Array.isArray(coordinate) ||
    coordinate.length < 2
  ) {
    return false;
  }

  const longitude = coordinate[0];
  const latitude = coordinate[1];

  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};