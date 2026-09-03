using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services
{
    public class RouteAnalysisService : IRouteAnalysisService
    {
        private readonly IRouteService _routeService;
        private readonly IRouteSamplingService _routeSamplingService;
        private readonly IWeatherService _weatherService;
        private readonly IWeatherRiskService _weatherRiskService;
        private readonly ILogger<RouteAnalysisService> _logger;

        public RouteAnalysisService(
            IRouteService routeService,
            IRouteSamplingService routeSamplingService,
            IWeatherService weatherService,
            IWeatherRiskService weatherRiskService,
            ILogger<RouteAnalysisService> logger)
        {
            _routeService = routeService;
            _routeSamplingService = routeSamplingService;
            _weatherService = weatherService;
            _weatherRiskService = weatherRiskService;
            _logger = logger;
        }

        public async Task<AnalyzeResponse> ProcessAsync(
            AnalyzeDTO model)
        {
            _logger.LogInformation(
                "Solicitando rota à HERE.");

            var route = await _routeService.GetRouteCoordinatesAsync(
                model.LatOrigin,
                model.LongOrigin,
                model.LatDestination,
                model.LongDestination,
                model.Transport);

            _logger.LogInformation(
                "Rota recebida. Distância: {DistanceMeters} metros. " +
                "Duração: {DurationSeconds} segundos. " +
                "Coordenadas: {CoordinateCount}.",
                route.DistanceMeters,
                route.DurationSeconds,
                route.Coordinates.Count);

            var samples = _routeSamplingService.CreateSamples(
                route,
                model.Date);

            if (samples.Count < 2)
            {
                throw new InvalidOperationException(
                    "A rota não possui amostras suficientes para criar segmentos.");
            }

            _logger.LogInformation(
                "Foram criadas {SampleCount} amostras para a rota.",
                samples.Count);

            var segments = new List<RouteRiskSegment>();

            for (
                var sampleIndex = 1;
                sampleIndex < samples.Count;
                sampleIndex++)
            {
                var startSample = samples[sampleIndex - 1];
                var endSample = samples[sampleIndex];

                _logger.LogInformation(
                    "Consultando clima da amostra " +
                    "{CurrentSample}/{TotalSamples}. " +
                    "Distância: {DistanceMeters} metros. " +
                    "Coordenada: {Latitude}, {Longitude}. " +
                    "ETA: {EstimatedArrivalTime}.",
                    sampleIndex,
                    samples.Count - 1,
                    endSample.AccumulatedDistanceMeters,
                    endSample.Latitude,
                    endSample.Longitude,
                    endSample.EstimatedArrivalTime);

                WeatherData weather;

                try
                {
                    weather = await _weatherService.GetWeatherAsync(
                        endSample);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Falha ao consultar o clima da amostra " +
                        "{CurrentSample}/{TotalSamples}. " +
                        "Distância: {DistanceMeters} metros. " +
                        "Coordenada: {Latitude}, {Longitude}. " +
                        "ETA: {EstimatedArrivalTime}.",
                        sampleIndex,
                        samples.Count - 1,
                        endSample.AccumulatedDistanceMeters,
                        endSample.Latitude,
                        endSample.Longitude,
                        endSample.EstimatedArrivalTime);

                    throw new InvalidOperationException(
                        "Não foi possível obter o clima do trecho " +
                        $"{sampleIndex}, próximo de " +
                        $"{endSample.AccumulatedDistanceMeters / 1000.0:F1} km.",
                        ex);
                }

                var risk = _weatherRiskService.CalculateRisk(
                    weather);

                segments.Add(new RouteRiskSegment
                {
                    StartCoordinateIndex =
                        startSample.CoordinateIndex,

                    EndCoordinateIndex =
                        endSample.CoordinateIndex,

                    StartDistanceMeters =
                        startSample.AccumulatedDistanceMeters,

                    EndDistanceMeters =
                        endSample.AccumulatedDistanceMeters,

                    EstimatedArrivalTime =
                        endSample.EstimatedArrivalTime,

                    RiskScore = risk.Score,

                    RiskLevel = risk.Level,

                    Summary = risk.Summary,

                    Weather = weather
                });

                _logger.LogInformation(
                    "Amostra {CurrentSample}/{TotalSamples} concluída. " +
                    "Risco: {RiskScore}/10, nível {RiskLevel}.",
                    sampleIndex,
                    samples.Count - 1,
                    risk.Score,
                    risk.Level);
            }

            if (segments.Count == 0)
            {
                throw new InvalidOperationException(
                    "Nenhum segmento climático foi criado.");
            }

            var highestRiskSegment = segments
                .OrderByDescending(
                    segment => segment.RiskScore)
                .First();

            _logger.LogInformation(
                "Análise climática concluída. " +
                "Segmentos: {SegmentCount}. " +
                "Maior risco: {FinalScore}/10, " +
                "nível {FinalRiskLevel}.",
                segments.Count,
                highestRiskSegment.RiskScore,
                highestRiskSegment.RiskLevel);

            return new AnalyzeResponse
            {
                Segments = segments,
                FinalScore = highestRiskSegment.RiskScore,
                FinalRiskLevel = highestRiskSegment.RiskLevel,
                FinalSummary = highestRiskSegment.Summary,
                Coordinates = route.GeoJson,
                DistanceMeters = route.DistanceMeters,
                DurationSeconds = route.DurationSeconds,
                CoordinateCount = route.Coordinates.Count,
                SampleCount = samples.Count
            };
        }
    }
}