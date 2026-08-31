export interface WeatherData {
  DateTime: string;
  TemperatureCelsius: number;
  HumidityPercent: number;
  PrecipitationMillimeters: number;
  PrecipitationProbabilityPercent: number;
  WindSpeedKph: number;
  VisibilityKm: number;
  SnowMillimeters: number;
  Conditions: string;
}

export interface RouteRiskSegment {
  StartCoordinateIndex: number;
  EndCoordinateIndex: number;
  StartDistanceMeters: number;
  EndDistanceMeters: number;
  EstimatedArrivalTime: string;
  RiskScore: number;
  RiskLevel: 'Low' | 'Moderate' | 'High';
  Summary: string;
  Weather: WeatherData;
}

export interface AnalyzeResponse {
  Segments: RouteRiskSegment[];
  FinalScore: number;
  FinalRiskLevel: 'Low' | 'Moderate' | 'High';
  FinalSummary: string;
  Coordinates: string;
  DistanceMeters: number;
  DurationSeconds: number;
  CoordinateCount: number;
  SampleCount: number;
}

export interface AnalyzeRequest {
  latOrigin: number;
  longOrigin: number;
  latDestination: number;
  longDestination: number;
  date: string;
  transport: string;
  language: string;
}

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5043/api';

const API_URL = `${BASE_URL.replace(/\/$/, '')}/route-analysis/analyze`;

export const analyzeRoute = async (
  params: AnalyzeRequest
): Promise<AnalyzeResponse> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `API error ${response.status}: ${responseBody}`
    );
  }

  return await response.json() as AnalyzeResponse;
};