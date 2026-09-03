import { Car, Bike, PersonStanding, CalendarDays, Timer, Zap, Loader2, Navigation, ChevronLeft, ChevronRight } from "lucide-react";
import MapView from "../components/MapView";
import { useState, useEffect } from "react";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { TransportType } from "../models/RouteRequest";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import EngineLoading from "../components/EngineLoading";
import { type AnalyzeResponse, analyzeRoute, type AnalyzeRequest } from "../services/api";
import { LiaBicycleSolid } from "react-icons/lia";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [analyzing, setAnalyzing] = useState(false);
  const [transportMode, setTransportMode] = useState<typeof TransportType[keyof typeof TransportType]>(TransportType.Car);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [minDate, setMinDate] = useState<string>("");
  const [apiResponse, setApiResponse] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Painel retrátil: recolhe ao analisar, reabre no hover/foco
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [panelHovered, setPanelHovered] = useState(false);
  const [panelFocused, setPanelFocused] = useState(false);
  const isPanelOpen = !panelCollapsed || panelHovered || panelFocused;

  // A aba só nasce na primeira análise. panelCollapsed entra na conta como trava
  const showPanelHandle = analyzing || apiResponse !== null || panelCollapsed;

  const [origin, setOrigin] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [destination, setDestination] = useState<{ name: string; lat: number; lon: number } | null>(null);

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setMinDate(`${year}-${month}-${day}`);
  }, []);

  const resetForm = () => {
    setOrigin(null);
    setDestination(null);
    setSelectedDate("");
    setSelectedTime("");
    setTransportMode(TransportType.Car);
    setResetKey(prev => prev + 1);
  };

  const handleAnalyzeClick = async () => {
    if (!origin || !destination || !selectedDate || !selectedTime) {
      toast.error(t('errors.fillAllFields'), { theme: "dark" });
      return;
    }

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();

    if (selectedDateTime <= now) {
      toast.error(t('errors.futureDateRequired'), { theme: "dark" });
      return;
    }

    setAnalyzing(true);
    setPanelCollapsed(true);
    setPanelHovered(false);

    try {
      setLoading(true);
      const apiRequest: AnalyzeRequest = {
        latOrigin: origin.lat,
        longOrigin: origin.lon,
        latDestination: destination.lat,
        longDestination: destination.lon,
        date: selectedDateTime.toISOString(),
        transport: transportMode,
        language: i18n.language
      };

      const response = await analyzeRoute(apiRequest) as AnalyzeResponse;

      if (response) {
        setApiResponse(response);
      } else {
        toast.error(t('errors.noResponse'), { theme: "dark" });
      }
    } catch (error) {
      toast.error(t('errors.apiError'), { theme: "dark" });
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const isTimeValid = (time: string): boolean => {
    if (selectedDate !== minDate) return true;
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    if (hours > now.getHours()) return true;
    if (hours === now.getHours() && minutes > now.getMinutes()) return true;
    return false;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (selectedDate === minDate && !isTimeValid(newTime)) {
      toast.warning(t('errors.futureTimeRequired'), { theme: "dark" });
      return;
    }
    setSelectedTime(newTime);
  };

  const handleReset = () => {
    setApiResponse(null);
    setAnalyzing(false);
    setPanelCollapsed(false);
    resetForm();
  };

  return (
    <div className="relative h-screen w-full bg-slate-900 overflow-hidden pt-[72px]">
      
      {/* MAPA FULLSCREEN */}
      <div className="absolute inset-0 z-0 pt-[72px]">
        <MapView apiResponse={apiResponse} />
      </div>

      {analyzing && (
        <EngineLoading
          isLoading={analyzing || loading}
          onLoadingComplete={() => {
            if (apiResponse) setAnalyzing(false);
          }}
          minDuration={2000}
        />
      )}

      {/* PAINEL FLUTUANTE */}
      <div
        className="absolute top-[110px] left-4 md:left-8 z-10 flex items-start gap-2 transition-transform duration-500 ease-in-out"
        style={{ transform: isPanelOpen ? "translateX(0)" : "translateX(calc(-100% + 3rem))" }}
        onMouseEnter={() => setPanelHovered(true)}
        onMouseLeave={() => setPanelHovered(false)}
        onFocus={() => setPanelFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPanelFocused(false);
        }}
      >
        <div className="w-[calc(100vw-5rem)] md:w-[440px] max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0)] p-8 text-slate-200">
          
          <div className="mb-10 border-b border-slate-700/50 pb-5">
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Navigation className="text-cyan-400 w-8 h-8" />
              RouteCast Engine
            </h2>
            <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest">
              {t('app.tagline')}
            </p>
          </div>

          <form className="space-y-8">
            {/* Origin */}
            <div className="relative group">
              <label className="text-sm font-semibold uppercase tracking-widest mb-3 text-slate-400 block">
                {t('location.origin')}
              </label>
              <div className="bg-slate-800/80 border border-slate-600 rounded-xl transition-all group-focus-within:border-cyan-400/50 group-focus-within:shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <LocationAutocomplete
                  placeholder={t('location.placeholder.origin')}
                  onLocationSelect={(location) => setOrigin(location)}
                  resetKey={resetKey}
                />
              </div>
            </div>

            {/* Destination */}
            <div className="relative group">
              <label className="text-sm font-semibold uppercase tracking-widest mb-3 text-slate-400 block">
                {t('location.destination')}
              </label>
              <div className="bg-slate-800/80 border border-slate-600 rounded-xl transition-all group-focus-within:border-cyan-400/50 group-focus-within:shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <LocationAutocomplete
                  placeholder={t('location.placeholder.destination')}
                  onLocationSelect={(location) => setDestination(location)}
                  resetKey={resetKey}
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex gap-5">
              <div className="flex-1 relative group">
                <label className="text-sm font-semibold uppercase tracking-widest mb-3 text-slate-400 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-cyan-400" /> {t('form.date')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-4 py-3.5 bg-slate-100 text-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all font-medium"
                />
              </div>
              <div className="flex-1 relative group">
                <label className="text-sm font-semibold uppercase tracking-widest mb-3 text-slate-400 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-cyan-400" /> {t('form.time')}
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={handleTimeChange}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-4 py-3.5 bg-slate-100 text-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all font-medium"                />
              </div>
            </div>

            {/* Transport Mode */}
            <div className="pt-2">
              <label className="text-sm font-semibold uppercase tracking-widest mb-4 text-slate-400 block">
                {t('form.transportMode')}
              </label>
              <div className="grid grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setTransportMode(TransportType.Car)}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${transportMode === TransportType.Car ? "bg-cyan-400/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-105" : "bg-slate-800/80 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}
                >
                  <Car className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode(TransportType.Motorcycle)}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${transportMode === TransportType.Motorcycle ? "bg-cyan-400/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-105" : "bg-slate-800/80 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}
                >
                  <Bike className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode(TransportType.Bike)}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${transportMode === TransportType.Bike ? "bg-cyan-400/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-105" : "bg-slate-800/80 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}
                >
                  <LiaBicycleSolid className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode(TransportType.Walking)}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${transportMode === TransportType.Walking ? "bg-cyan-400/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-105" : "bg-slate-800/80 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}
                >
                  <PersonStanding className="w-7 h-7" />
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={apiResponse ? handleReset : handleAnalyzeClick}
              disabled={analyzing && !apiResponse}
              className={`w-full mt-8 py-5 rounded-xl font-bold tracking-widest uppercase text-base transition-all shadow-lg flex items-center justify-center gap-3 overflow-hidden relative
                ${analyzing && !apiResponse ? 'bg-slate-800 cursor-not-allowed text-slate-500 border border-slate-700' : 
                  apiResponse ? 'bg-slate-900 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10' : 
                  'bg-cyan-500 hover:bg-cyan-400 text-slate-900 border border-cyan-300'}`}
            >
              {analyzing && !apiResponse ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> {t('form.analyzing')}</>
              ) : apiResponse ? (
                <><Zap className="w-6 h-6" /> {t('form.newAnalysis')}</>
              ) : (
                <><Zap className="w-6 h-6" /> {t('form.analyze')}</>
              )}
            </button>
          </form>

        </div>

        {/* ABA LATERAL — só existe depois da primeira análise; clique alterna, hover reabre */}
        {showPanelHandle && (
          <button
            type="button"
            onClick={() => setPanelCollapsed(prev => !prev)}
            title={isPanelOpen ? t('panel.collapse') : t('panel.expand')}
            aria-label={isPanelOpen ? t('panel.collapse') : t('panel.expand')}
            aria-expanded={isPanelOpen}
            className="mt-2 w-10 shrink-0 flex flex-col items-center gap-3 py-4 rounded-xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 text-cyan-400 shadow-lg hover:bg-slate-800/90 hover:border-cyan-400/50 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-rl]">
              {t('panel.label')}
            </span>
            {isPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(34, 211, 238, 0.3); border-radius: 20px; }
      `}</style>
    </div>
  );
}