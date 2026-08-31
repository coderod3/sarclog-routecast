using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Services.Interfaces;

public interface IWeatherService
{
    Task<WeatherData> GetWeatherAsync(
        RouteSample sample,
        CancellationToken cancellationToken = default);
}
