import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Activity } from 'lucide-react';

interface EngineLoadingProps {
  isLoading: boolean;
  onLoadingComplete: () => void;
  minDuration?: number;
}


const STATUS_KEYS = [
  'loading.decodingGeometry',
  'loading.slicingWaypoints',
  'loading.syncingWeather',
  'loading.rulesEngine',
  'loading.riskIndexes'
];

const EngineLoading: React.FC<EngineLoadingProps> = ({
  isLoading,
  onLoadingComplete,
  minDuration = 2000,
}) => {
  const { t } = useTranslation('common');
  const [progress, setProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const [statusKey, setStatusKey] = useState('loading.starting');

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let timerId: ReturnType<typeof setTimeout>;
    let statusIntervalId: ReturnType<typeof setInterval>;

    if (isLoading) {
      setShowLoading(true);
      setProgress(0);

      let msgIndex = 0;

      statusIntervalId = setInterval(() => {
        msgIndex = (msgIndex + 1) % STATUS_KEYS.length;
        setStatusKey(STATUS_KEYS[msgIndex]);
      }, 800);

      // Progresso suave
      intervalId = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (95 - prev) * 0.1;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 100);

      // Tempo de conclusão
      timerId = setTimeout(() => {
        clearInterval(intervalId);
        clearInterval(statusIntervalId);
        setProgress(100);
        setStatusKey('loading.finished');
        
        setTimeout(() => {
          setShowLoading(false);
          onLoadingComplete();
        }, 400);
      }, minDuration);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timerId) clearTimeout(timerId);
      if (statusIntervalId) clearInterval(statusIntervalId);
    };
  }, [isLoading, minDuration, onLoadingComplete]);

  useEffect(() => {
    if (!isLoading && showLoading) {
      setProgress(100);
      setStatusKey('loading.finished');
      setTimeout(() => {
        setShowLoading(false);
        onLoadingComplete();
      }, 300);
    }
  }, [isLoading, showLoading, onLoadingComplete]);

  if (!showLoading) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-w-sm w-full text-center flex flex-col items-center">
        
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          
          {/* Loader2 */}
          <Loader2 className="absolute inset-0 w-full h-full text-blue-600 animate-spin opacity-50" strokeWidth={1.5} />

          {/* O container interno */}
          <div className="relative w-16 h-16 flex items-center justify-center z-10">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
            
            <div className="absolute inset-0 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center">
              <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
          </div>
        </div>
        
        <h3 className="text-slate-200 text-lg font-bold mb-2 tracking-wide">
          RouteCast Engine
        </h3>
        
        <p className="text-blue-400 text-sm mb-6 h-5 font-medium">
          {t(statusKey)}
        </p>
        
        {/* Barra de progresso */}
        <div className="w-full bg-slate-900 rounded-full h-2 mb-3 overflow-hidden border border-slate-700">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-200 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="text-slate-400 text-xs font-semibold tracking-widest">
          {Math.round(progress)}% {t('loading.completed')}
        </div>
      </div>
    </div>
  );
};

export default EngineLoading;