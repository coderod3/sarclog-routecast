using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services
{
    public class Power : IPower
    {
        private readonly IRouteService _routeService;
        private readonly IPowerService _powerService;

        public Power(IRouteService routeService, IPowerService powerService)
        {
            _routeService = routeService;
            _powerService = powerService;
        }

        public async Task<AnalyzeResponse> ProcessAsync(AnalyzeDTO model)
        {
            // 1. Obter a geometria da rota bruta do OpenRouteService (Backend assume controle)
            MapsData mapsData = await _routeService.GetRouteCoordinatesAsync(
                model.LatOrigin,
                model.LongOrigin,
                model.LatDestination,
                model.LongDestination,
                model.Transport);

            // TODO: [RouteCast] Amostragem espaço-temporal (ETA)
            // TODO: [RouteCast] Chamar motor de regras climáticas

            // Retorno mock inicial
            return await Task.FromResult(new AnalyzeResponse
            {
                FinalScore = 0,
                FinalSummary = "[EM CONSTRUÇÃO] O Motor RouteCast analisará a geometria da rota e processará o risco climático em breve.",
                
                // MUDANÇA AQUI: Repassa o JSON bruto da rota para o Frontend em vez de mandar "null"
                Coordinates = mapsData.json, 
                
                Segments = new List<Segment>()
            });
        }
    }
}