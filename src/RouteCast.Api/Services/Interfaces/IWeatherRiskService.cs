using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Services.Interfaces;

public interface IWeatherRiskService
{
    (int Score, string Level, string Summary) CalculateRisk(
        WeatherData weather);
}