export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  boundingbox: string[];
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const searchPlaces = async (query: string): Promise<NominatimResult[]> => {
  if (!query || query.trim().length < 3) return [];

  try {
    // Adiciona um pequeno atraso para evitar muitas requisições durante a digitação
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verifica se a consulta parece ser um endereço de rua com número
    const hasStreetNumber = /\d+\s*$/.test(query) || /,\s*\d+/.test(query);

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      // Adiciona parâmetros para melhorar a busca por rua
      street: hasStreetNumber ? query : '',
      countrycodes: 'es,pt,br,us', // Códigos de país para Espanha, Portugal brasil estados unidos
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'RouteCast-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

// Função para verificar se a entrada é uma coordenada
export const isCoordinate = (input: string): boolean => {
  // Regex para coordenadas no formato "latitude,longitude"
  const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
  return coordRegex.test(input);
};

// Função para extrair coordenadas de uma string
export const extractCoordinates = (input: string): { lat: number; lon: number } | null => {
  if (!isCoordinate(input)) return null;

  const [lat, lon] = input.split(',').map(Number);
  return { lat, lon };
};

// Função para formatar o endereço para exibição
export const formatAddress = (result: NominatimResult): string => {
  const address = result.address;

  // Formato simplificado: Rua/Local, Cidade - Estado, País
  let formattedAddress = '';

  // Adiciona rua ou nome do local
  if (address.road) {
    formattedAddress += address.road;
  } else {
    // Se não tiver rua, usa o nome principal
    const mainParts = result.display_name.split(',')[0];
    formattedAddress += mainParts;
  }

  // Adiciona cidade e estado
  if (address.city) {
    formattedAddress += `, ${address.city}`;
    if (address.state) {
      formattedAddress += ` - ${address.state}`;
    }
  } else if (address.state) {
    formattedAddress += `, ${address.state}`;
  }

  // Adiciona país
  if (address.country) {
    formattedAddress += `, ${address.country}`;
  }

  return formattedAddress;
};