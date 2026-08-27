import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { searchPlaces, isCoordinate, extractCoordinates, formatAddress, type NominatimResult } from '../services/nominatimService';
import { useTranslation } from 'react-i18next';

interface LocationAutocompleteProps {
  placeholder: string;
  onLocationSelect: (location: { name: string; lat: number; lon: number }) => void;
  value?: string;
  resetKey?: number;
}

export default function LocationAutocomplete({ placeholder, onLocationSelect, value, resetKey }: LocationAutocompleteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Efeito para resetar o campo quando resetKey mudar
  useEffect(() => {
    setQuery('');
    setResults([]);
  }, [resetKey]);

  // Efeito para atualizar o campo quando value mudar
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const handleSearch = async () => {
      // Se for uma coordenada, não precisa buscar
      if (isCoordinate(query)) {
        const coords = extractCoordinates(query);
        if (coords) {
          setResults([]);
          return;
        }
      }

      setLoading(true);
      const searchResults = await searchPlaces(query);
      setResults(searchResults);
      setLoading(false);
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    // Fechar resultados ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (result: NominatimResult) => {
    // Exibe apenas o endereço formatado, não as coordenadas
    setQuery(formatAddress(result));
    setShowResults(false);
    onLocationSelect({
      name: formatAddress(result),
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowResults(true);

    // Se for coordenada, processar diretamente
    if (isCoordinate(e.target.value)) {
      const coords = extractCoordinates(e.target.value);
      if (coords) {
        // Exibe uma mensagem genérica em vez das coordenadas
        setQuery(t('location.selected'));
        onLocationSelect({
          name: t('location.byCoordinates'),
          lat: coords.lat,
          lon: coords.lon
        });
      }
    }
  };

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-3 text-white/70 w-5 h-5" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-3 bg-[#2e3d81]/60 border-0 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-[#FFB32C] focus:outline-none shadow-inner transition-all duration-200 hover:bg-[#2e3d81]/80"
      />

      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full bg-[#2e3d81] border border-[#2C4EA3] rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result) => (
            <div
              key={result.place_id}
              onClick={() => handleSelectLocation(result)}
              className="px-4 py-2 hover:bg-[#2C4EA3] cursor-pointer text-white text-sm border-b border-[#2C4EA3]/50 last:border-b-0"
            >
              {formatAddress(result)}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white/80 rounded-full"></div>
        </div>
      )}
    </div>
  );
}