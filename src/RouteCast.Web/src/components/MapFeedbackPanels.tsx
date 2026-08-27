import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaInfoCircle, FaShieldAlt, FaExclamationTriangle, FaSkullCrossbones } from 'react-icons/fa';
import { getRiskSeverityConfig } from '../domain/RiskInterpreter';
import type { AnalyzeResponse } from '../services/api';

interface MapFeedbackPanelsProps {
  apiResponse: AnalyzeResponse | null;
  hasRouteData: boolean;
  hasSegments: boolean;
}

export default function MapFeedbackPanels({ apiResponse, hasRouteData, hasSegments }: MapFeedbackPanelsProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  // Gatilho para a animação de entrada
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const riskConfig = apiResponse ? getRiskSeverityConfig(apiResponse.FinalScore) : null;

  return (
    <>
      {/*Legenda de Alertas*/}
      {hasRouteData && hasSegments && (
        <div className={`absolute top-4 right-4 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-3 z-[999] transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
          <h3 className="font-bold text-gray-800 mb-2 text-center border-b pb-1">{t('map.alertLevels')}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-4 rounded-full bg-red-500"></span>
            <span className="text-sm">{t('map.highRisk')}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
            <span className="text-sm">{t('map.moderateRisk')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500"></span>
            <span className="text-sm">{t('map.lowRisk')}</span>
          </div>
        </div>
      )}

      {/* Banner de Feedback Inferior */}
      {apiResponse && (
        <div className={`z-[999] absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} max-w-md w-11/12`}>
          
          {!hasSegments ? (
            /* MODO "EM CONSTRUÇÃO": Rota sem fatiamento de clima (Azul) */
            <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-lg p-4 flex items-center gap-4 border-l-4 border-blue-500">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full flex-shrink-0">
                <FaInfoCircle className="text-2xl" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-[#193A84] text-sm mb-1">Status do Sistema</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {apiResponse.FinalSummary}
                </p>
              </div>
            </div>
          ) : (
            /* MODO "RouteCast": Rota com Score Climático Final Calculado */
            <div className={`bg-white/95 backdrop-blur-sm shadow-xl rounded-lg px-6 py-4 text-center border-l-4 ${
              apiResponse.FinalScore <= 4 ? 'border-red-500' :
              apiResponse.FinalScore < 7 ? 'border-yellow-500' :
              'border-green-500'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  apiResponse.FinalScore <= 4 ? 'bg-red-100 text-red-500' :
                  apiResponse.FinalScore < 7 ? 'bg-yellow-100 text-yellow-500' :
                  'bg-green-100 text-green-500'
                }`}>
                  {riskConfig?.icon}
                </div>
                
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-sm mb-1">{apiResponse.FinalSummary}</h3>
                  <p className={`text-xs ${riskConfig?.colorClass} font-medium`}>
                    {riskConfig && t(riskConfig.descriptionKey)}
                  </p>
                  
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-200 h-2 flex-grow rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            apiResponse.FinalScore <= 4 ? 'bg-red-500' :
                            apiResponse.FinalScore < 7 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(apiResponse.FinalScore / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{apiResponse.FinalScore}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}