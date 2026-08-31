using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Services.Interfaces;

public interface IRouteSamplingService
{
    List<RouteSample> CreateSamples(
        RouteGeometryResult route,
        DateTime departureTime);
}