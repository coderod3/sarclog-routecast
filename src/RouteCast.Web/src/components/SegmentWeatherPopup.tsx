import { Popup } from 'react-leaflet';
import {
  FaCloudRain,
  FaEye,
  FaSnowflake,
  FaTemperatureHigh,
  FaTint,
  FaWind
} from 'react-icons/fa';
import type { RouteRiskSegment } from '../services/api';

interface SegmentWeatherPopupProps {
  segmentData: RouteRiskSegment;
}

const getRiskStyle = (
  riskLevel: RouteRiskSegment['RiskLevel']
) => {
  switch (riskLevel) {
    case 'High':
      return {
        label: 'Risco alto',
        textClass: 'text-red-600',
        backgroundClass: 'bg-red-100',
        borderClass: 'border-red-500'
      };

    case 'Moderate':
      return {
        label: 'Risco moderado',
        textClass: 'text-yellow-600',
        backgroundClass: 'bg-yellow-100',
        borderClass: 'border-yellow-500'
      };

    case 'Low':
    default:
      return {
        label: 'Risco baixo',
        textClass: 'text-green-600',
        backgroundClass: 'bg-green-100',
        borderClass: 'border-green-500'
      };
  }
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

const formatDistance = (meters: number): string => {
  return `${(meters / 1000).toFixed(1)} km`;
};

export default function SegmentWeatherPopup({
  segmentData
}: SegmentWeatherPopupProps) {
  const riskStyle = getRiskStyle(
    segmentData.RiskLevel
  );

  const weather = segmentData.Weather;

  return (
    <Popup className="custom-popup">
      <div
        className={`min-w-[260px] border-l-4 p-3 ${riskStyle.borderClass}`}
      >
        <div className="mb-3 border-b border-gray-200 pb-2">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${riskStyle.backgroundClass} ${riskStyle.textClass}`}
            >
              {riskStyle.label}
            </span>

            <span className="text-sm font-bold text-gray-700">
              {segmentData.RiskScore}/10
            </span>
          </div>

          <p className="mt-2 text-sm font-medium text-gray-800">
            {segmentData.Summary}
          </p>
        </div>

        <div className="mb-3 space-y-2 text-sm text-gray-700">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">
              Trecho
            </span>

            <span>
              {formatDistance(
                segmentData.StartDistanceMeters
              )}
              {' até '}
              {formatDistance(
                segmentData.EndDistanceMeters
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">
              Chegada estimada
            </span>

            <span>
              {formatDateTime(
                segmentData.EstimatedArrivalTime
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">
              Previsão utilizada
            </span>

            <span>
              {formatDateTime(weather.DateTime)}
            </span>
          </div>
        </div>

        <div className="space-y-2 border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <FaTemperatureHigh className="text-red-500" />
              Temperatura
            </span>

            <strong className="text-gray-800">
              {weather.TemperatureCelsius.toFixed(1)} °C
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <FaTint className="text-blue-500" />
              Umidade
            </span>

            <strong className="text-gray-800">
              {weather.HumidityPercent.toFixed(0)}%
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <FaCloudRain className="text-blue-600" />
              Precipitação
            </span>

            <strong className="text-gray-800">
              {weather.PrecipitationMillimeters.toFixed(1)} mm
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <FaCloudRain className="text-cyan-600" />
              Probabilidade
            </span>

            <strong className="text-gray-800">
              {weather.PrecipitationProbabilityPercent.toFixed(0)}%
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <FaWind className="text-slate-500" />
              Vento
            </span>

            <strong className="text-gray-800">
              {weather.WindSpeedKph.toFixed(1)} km/h
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <FaEye className="text-gray-500" />
              Visibilidade
            </span>

            <strong className="text-gray-800">
              {weather.VisibilityKm.toFixed(1)} km
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-gray-600">
              <FaSnowflake className="text-cyan-500" />
              Neve
            </span>

            <strong className="text-gray-800">
              {weather.SnowMillimeters.toFixed(1)} mm
            </strong>
          </div>
        </div>

        <div className="mt-3 border-t border-gray-200 pt-2">
          <p className="text-xs font-medium text-gray-500">
            Condição
          </p>

          <p className="text-sm font-semibold text-gray-800">
            {weather.Conditions || 'Não informada'}
          </p>
        </div>
      </div>
    </Popup>
  );
}