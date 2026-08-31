using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Services.Interfaces;

public interface IRouteService
{
    /// <summary>
    /// Obtém a geometria, as coordenadas, a distância e a duração da rota.
    /// </summary>
    Task<RouteGeometryResult> GetRouteCoordinatesAsync(
        double latOrigin,
        double longOrigin,
        double latDestination,
        double longDestination,
        string transportType);
}