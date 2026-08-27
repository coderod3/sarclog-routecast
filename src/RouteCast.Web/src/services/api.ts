// Interface para a resposta da API
export interface AnalyzeResponse {
    Segments: {
        Index: number;
        Score: number;
        Summary: string;
        Indicators: {
            Temperature: string;
            Humidity: string;
            Precipitation: string;
            Snow: boolean;
        };
    }[];
    FinalScore: number;
    FinalSummary: string;
    Coordinates: string | null; 
}

// Interface para a requisição da API
export interface AnalyzeRequest {
    latOrigin: number;
    longOrigin: number;
    latDestination: number;
    longDestination: number;
    date: string;
    transport: string;
    language: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5043/api';

const API_URL = `${BASE_URL}/power/Analyze`;

/**
 * Analisa uma rota enviando a requisição para o Backend (RouteCast.Api)
 */
export const analyzeRoute = async (params: AnalyzeRequest): Promise<AnalyzeResponse> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error analyzing route:', error);
        throw error;
    }
};