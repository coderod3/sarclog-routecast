using System.Runtime.ExceptionServices;
using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services
{
    public class RouteAnalysisService : IRouteAnalysisService
    {
        private const int DefaultMaximumConcurrentWeatherRequests = 4;

        private readonly IRouteService _routeService;
        private readonly IRouteSamplingService _routeSamplingService;
        private readonly IWeatherService _weatherService;
        private readonly IWeatherRiskService _weatherRiskService;
        private readonly ILogger<RouteAnalysisService> _logger;
        private readonly int _maximumConcurrentWeatherRequests;

        public RouteAnalysisService(
            IRouteService routeService,
            IRouteSamplingService routeSamplingService,
            IWeatherService weatherService,
            IWeatherRiskService weatherRiskService,
            IConfiguration configuration,
            ILogger<RouteAnalysisService> logger)
        {
            _routeService = routeService;
            _routeSamplingService = routeSamplingService;
            _weatherService = weatherService;
            _weatherRiskService = weatherRiskService;
            _logger = logger;

            var configuredConcurrency = configuration.GetValue<int?>(
                "RouteAnalysis:MaxConcurrentWeatherRequests");

            _maximumConcurrentWeatherRequests =
                configuredConcurrency is > 0
                    ? configuredConcurrency.Value
                    : DefaultMaximumConcurrentWeatherRequests;
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

            var segmentCount = samples.Count - 1;

            _logger.LogInformation(
                "Foram criadas {SampleCount} amostras para a rota. " +
                "Consultando o clima de {SegmentCount} trechos com até " +
                "{MaximumConcurrency} chamadas simultâneas.",
                samples.Count,
                segmentCount,
                _maximumConcurrentWeatherRequests);

            var segments = await BuildSegmentsAsync(
                samples,
                segmentCount);

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

        /// <summary>
        /// Consulta o clima de todos os trechos em paralelo, respeitando um teto
        /// de chamadas simultâneas ao provedor. A ordem dos trechos é preservada
        /// porque <see cref="Task.WhenAll{TResult}(Task{TResult}[])"/> devolve os
        /// resultados na mesma ordem em que as tarefas foram criadas.
        /// </summary>
        private async Task<List<RouteRiskSegment>> BuildSegmentsAsync(
            List<RouteSample> samples,
            int segmentCount)
        {
            using var concurrencyLimiter = new SemaphoreSlim(
                _maximumConcurrentWeatherRequests);

            // Assim que um trecho falha, os que ainda não começaram são
            // cancelados: sem isso a análise já perdida continuaria consumindo
            // chamadas pagas do provedor de clima.
            using var failureSignal = new CancellationTokenSource();

            var segmentTasks = new List<Task<RouteRiskSegment>>(segmentCount);

            for (
                var sampleIndex = 1;
                sampleIndex < samples.Count;
                sampleIndex++)
            {
                segmentTasks.Add(BuildSegmentAsync(
                    sampleIndex,
                    samples[sampleIndex - 1],
                    samples[sampleIndex],
                    segmentCount,
                    concurrencyLimiter,
                    failureSignal));
            }

            try
            {
                var segments = await Task.WhenAll(segmentTasks);

                return segments.ToList();
            }
            catch (Exception)
            {
                // Várias consultas podem falhar ao mesmo tempo. Relança a falha do
                // trecho mais próximo da origem, que é a que interessa ao usuário,
                // em vez da primeira que por acaso terminou.
                var firstFailure = segmentTasks
                    .FirstOrDefault(task => task.IsFaulted);

                if (firstFailure?.Exception is not null)
                {
                    ExceptionDispatchInfo
                        .Capture(firstFailure.Exception.InnerExceptions[0])
                        .Throw();
                }

                throw;
            }
        }

        private async Task<RouteRiskSegment> BuildSegmentAsync(
            int sampleIndex,
            RouteSample startSample,
            RouteSample endSample,
            int segmentCount,
            SemaphoreSlim concurrencyLimiter,
            CancellationTokenSource failureSignal)
        {
            await concurrencyLimiter.WaitAsync(failureSignal.Token);

            try
            {
                _logger.LogInformation(
                    "Consultando clima da amostra " +
                    "{CurrentSample}/{TotalSamples}. " +
                    "Distância: {DistanceMeters} metros. " +
                    "Coordenada: {Latitude}, {Longitude}. " +
                    "ETA: {EstimatedArrivalTime}.",
                    sampleIndex,
                    segmentCount,
                    endSample.AccumulatedDistanceMeters,
                    endSample.Latitude,
                    endSample.Longitude,
                    endSample.EstimatedArrivalTime);

                WeatherData weather;

                try
                {
                    weather = await _weatherService.GetWeatherAsync(
                        endSample,
                        failureSignal.Token);
                }
                catch (OperationCanceledException)
                {
                    // Outro trecho já falhou; este nem chegou a ser consultado.
                    throw;
                }
                catch (Exception ex)
                {
                    failureSignal.Cancel();

                    _logger.LogError(
                        ex,
                        "Falha ao consultar o clima da amostra " +
                        "{CurrentSample}/{TotalSamples}. " +
                        "Distância: {DistanceMeters} metros. " +
                        "Coordenada: {Latitude}, {Longitude}. " +
                        "ETA: {EstimatedArrivalTime}.",
                        sampleIndex,
                        segmentCount,
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

                _logger.LogInformation(
                    "Amostra {CurrentSample}/{TotalSamples} concluída. " +
                    "Risco: {RiskScore}/10, nível {RiskLevel}.",
                    sampleIndex,
                    segmentCount,
                    risk.Score,
                    risk.Level);

                return new RouteRiskSegment
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
                };
            }
            finally
            {
                concurrencyLimiter.Release();
            }
        }
    }
}