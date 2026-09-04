import type { AnalyzeResponse } from '../services/api';
import {
  getRiskSeverityConfigByLevel,
  normalizeRiskScore
} from '../domain/RiskInterpreter';

interface MapFeedbackPanelsProps {
  apiResponse: AnalyzeResponse | null;
  hasRouteData: boolean;
  hasSegments: boolean;
}

const formatDistance = (meters: number): string => {
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds: number): string => {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};

export default function MapFeedbackPanels({
  apiResponse,
  hasRouteData,
  hasSegments
}: MapFeedbackPanelsProps) {
  if (!apiResponse || !hasRouteData) {
    return null;
  }

  const riskConfig = getRiskSeverityConfigByLevel(
    apiResponse.FinalRiskLevel
  );

  const normalizedScore = normalizeRiskScore(
    apiResponse.FinalScore
  );

  return (
    <>
      {hasSegments && (
        <div className="absolute right-4 top-4 z-[999] rounded-lg border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur-sm">
          <h3 className="mb-2 border-b border-gray-200 pb-1 text-center text-sm font-bold text-gray-800">
            Níveis de risco
          </h3>

          <div className="mb-2 flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-green-500" />

            <span className="text-xs text-gray-700">
              Baixo: 0 a 3
            </span>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-yellow-500" />

            <span className="text-xs text-gray-700">
              Moderado: 4 a 6
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-red-500" />

            <span className="text-xs text-gray-700">
              Alto: 7 a 10
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 z-[999] w-11/12 max-w-md -translate-x-1/2">
        <div
          className={`rounded-xl border border-gray-200 border-l-4 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm ${riskConfig.borderClass}`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${riskConfig.backgroundClass}`}
            >
              {riskConfig.icon}
            </div>

            <div className="min-w-0 flex-grow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    className={`text-sm font-bold ${riskConfig.colorClass}`}
                  >
                    {riskConfig.label}
                  </h3>

                  <p className="mt-0.5 text-xs leading-relaxed text-gray-700">
                    {apiResponse.FinalSummary}
                  </p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span
                    className={`text-base font-bold ${riskConfig.colorClass}`}
                  >
                    {normalizedScore}/10
                  </span>

                  <p className="text-[10px] uppercase tracking-wide text-gray-500">
                    risco
                  </p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${riskConfig.progressClass}`}
                  style={{
                    width: `${normalizedScore * 10}%`
                  }}
                />
              </div>

              <div className="mt-3 flex divide-x divide-gray-200 border-t border-gray-200 pt-2">
                <div className="flex-1 px-2 text-center first:pl-0">
                  <p className="text-[9px] uppercase tracking-wide text-gray-500">
                    Distância
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-gray-800">
                    {formatDistance(
                      apiResponse.DistanceMeters
                    )}
                  </p>
                </div>

                <div className="flex-1 px-2 text-center">
                  <p className="text-[9px] uppercase tracking-wide text-gray-500">
                    Duração
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-gray-800">
                    {formatDuration(
                      apiResponse.DurationSeconds
                    )}
                  </p>
                </div>

                <div className="flex-1 px-2 text-center last:pr-0">
                  <p className="text-[9px] uppercase tracking-wide text-gray-500">
                    Trechos
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-gray-800">
                    {apiResponse.Segments.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}