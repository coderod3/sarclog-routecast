using Microsoft.AspNetCore.Mvc;
using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Controllers
{
    [ApiController]
    [Route("api/route-analysis")]
    public class RouteAnalysisController : ControllerBase
    {
        private readonly IRouteAnalysisService _routeAnalysisService;
        private readonly ILogger<RouteAnalysisController> _logger;

        public RouteAnalysisController(
            IRouteAnalysisService routeAnalysisService,
            ILogger<RouteAnalysisController> logger)
        {
            _routeAnalysisService = routeAnalysisService;
            _logger = logger;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze(
            [FromBody] AnalyzeDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                _logger.LogInformation(
                    "Iniciando análise de rota. " +
                    "Origem: {OriginLatitude}, {OriginLongitude}. " +
                    "Destino: {DestinationLatitude}, {DestinationLongitude}. " +
                    "Transporte: {Transport}. " +
                    "Data: {DepartureDate}.",
                    model.LatOrigin,
                    model.LongOrigin,
                    model.LatDestination,
                    model.LongDestination,
                    model.Transport,
                    model.Date);

                var result =
                    await _routeAnalysisService.ProcessAsync(model);

                if (result == null)
                {
                    _logger.LogWarning(
                        "A análise da rota terminou sem retornar dados.");

                    return NotFound(new
                    {
                        message = "Nenhum dado retornado."
                    });
                }

                _logger.LogInformation(
                    "Análise concluída. " +
                    "Distância: {DistanceMeters} metros. " +
                    "Duração: {DurationSeconds} segundos. " +
                    "Segmentos: {SegmentCount}. " +
                    "Risco máximo: {FinalScore}.",
                    result.DistanceMeters,
                    result.DurationSeconds,
                    result.Segments.Count,
                    result.FinalScore);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Erro durante a análise da rota. " +
                    "Origem: {OriginLatitude}, {OriginLongitude}. " +
                    "Destino: {DestinationLatitude}, {DestinationLongitude}. " +
                    "Transporte: {Transport}. " +
                    "Data: {DepartureDate}.",
                    model.LatOrigin,
                    model.LongOrigin,
                    model.LatDestination,
                    model.LongDestination,
                    model.Transport,
                    model.Date);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Não foi possível analisar a rota."
                    });
            }
        }

        [HttpPost("ping")]
        public IActionResult Ping()
        {
            return Ok(new
            {
                message = "Pong",
                date = DateTime.UtcNow
            });
        }
    }
}