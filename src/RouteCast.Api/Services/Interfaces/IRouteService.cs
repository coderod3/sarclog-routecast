using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Services.Interfaces
{
    public interface IRouteService
    {
        /// <summary>
        /// Obtém todas as coordenadas (latitude/longitude) da rota entre dois pontos.
        /// </summary>
        Task<MapsData> GetRouteCoordinatesAsync(
            double latOrigin,
            double longOrigin,
            double latDestination,
            double longDestination,
            string transportType);

        // motor será acoplado aqui em breve

    }
}
