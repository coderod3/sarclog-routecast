import { Popup } from 'react-leaflet';
import { FaCloudRain, FaSnowflake, FaTemperatureHigh, FaTint } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { getRiskSeverityConfig } from '../domain/RiskInterpreter';
import type { AnalyzeResponse } from '../services/api';

interface SegmentWeatherPopupProps {
  segmentData: AnalyzeResponse['Segments'][0];
}

export default function SegmentWeatherPopup({ segmentData }: SegmentWeatherPopupProps) {
  const { t } = useTranslation();
  
  const riskConfig = getRiskSeverityConfig(segmentData.Score);

  const renderIndicator = (type: string, value: string | boolean) => {
    let icon;
    let label;
    let intensity = 1;

    if (typeof value === "string") {
      if (value === "Low") intensity = 1;
      else if (value === "Middle") intensity = 2;
      else if (value === "High") intensity = 3;
    } else if (type === 'snow') {
      intensity = value ? 3 : 0; 
    }

    switch (type) {
      case 'temperature':
        icon = <FaTemperatureHigh />;
        label = t('weather.temperature');
        break;
      case 'humidity':
        icon = <FaTint />;
        label = t('weather.humidity');
        break;
      case 'precipitation':
        icon = <FaCloudRain />;
        label = t('weather.precipitation');
        break;
      case 'snow':
        icon = <FaSnowflake />;
        label = t('weather.snow');
        break;
      default:
        icon = null;
        label = type;
    }

    return (
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-gray-600 ${type === 'snow' && typeof value === 'boolean' && value ? 'text-blue-600' : ''}`}>{icon}</span>
          <span className="text-xs font-medium text-gray-700">{label}</span>
          {type === 'snow' && typeof value === 'boolean' && (
            <span className={`text-xs font-medium ml-auto ${value ? 'text-blue-600' : 'text-gray-400'}`}>
              {value ? t('weather.present') : t('weather.absent')}
            </span>
          )}
        </div>
        {type !== 'snow' || typeof value !== 'boolean' ? (
          <div className="flex gap-1 h-2">
            <div className={`w-1/3 rounded-l ${intensity >= 1 ? 'bg-blue-400' : 'bg-gray-200'}`}></div>
            <div className={`w-1/3 ${intensity >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            <div className={`w-1/3 rounded-r ${intensity >= 3 ? 'bg-blue-700' : 'bg-gray-200'}`}></div>
          </div>
        ) : (
          <div className="flex gap-1 h-2">
            <div className={`w-full rounded ${value ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Popup className="custom-popup">
      <div className="p-2">
        {/* Cabeçalho do Popup: Ícone do Risco, Título e Tradução do Nível de Risco */}
        <div className="flex items-center gap-2 mb-3 border-b pb-2">
          {riskConfig.icon}
          <div>
            <h3 className="font-bold text-gray-800">{segmentData.Summary}</h3>
            <p className={`text-xs ${riskConfig.colorClass} font-medium`}>
              {t(riskConfig.textKey)}
            </p>
          </div>
        </div>

        {/* Corpo do Popup: Indicadores Climáticos */}
        <div className="space-y-1 mb-3">
          {renderIndicator('temperature', segmentData.Indicators.Temperature)}
          {renderIndicator('humidity', segmentData.Indicators.Humidity)}
          {renderIndicator('precipitation', segmentData.Indicators.Precipitation)}
          {renderIndicator('snow', segmentData.Indicators.Snow)}
        </div>

        {/* Rodapé do Popup: Recomendação do Sistema */}
        <div className="mt-3 pt-2 border-t">
          <p className="text-xs font-medium text-gray-700">{t('weather.recommendation')}:</p>
          <p className="text-sm text-gray-800 italic">
            {segmentData.Summary}
          </p>
        </div>
      </div>
    </Popup>
  );
}