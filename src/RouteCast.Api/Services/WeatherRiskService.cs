using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services;

public class WeatherRiskService : IWeatherRiskService
{
    public (int Score, string Level, string Summary) CalculateRisk(
        WeatherData weather)
    {
        var score = 0;
        var reasons = new List<string>();

        AddPrecipitationRisk(weather, ref score, reasons);
        AddWindRisk(weather, ref score, reasons);
        AddVisibilityRisk(weather, ref score, reasons);
        AddTemperatureRisk(weather, ref score, reasons);
        AddSnowRisk(weather, ref score, reasons);

        score = Math.Clamp(score, 0, 10);

        var level = GetRiskLevel(score);
        var summary = CreateSummary(level, reasons);

        return (score, level, summary);
    }

    private static void AddPrecipitationRisk(
        WeatherData weather,
        ref int score,
        ICollection<string> reasons)
    {
        if (weather.PrecipitationMillimeters >= 10 ||
            weather.PrecipitationProbabilityPercent >= 80)
        {
            score += 4;
            reasons.Add("chuva intensa ou muito provável");
            return;
        }

        if (weather.PrecipitationMillimeters >= 3 ||
            weather.PrecipitationProbabilityPercent >= 50)
        {
            score += 2;
            reasons.Add("possibilidade de chuva moderada");
            return;
        }

        if (weather.PrecipitationMillimeters > 0 ||
            weather.PrecipitationProbabilityPercent >= 30)
        {
            score += 1;
            reasons.Add("possibilidade de chuva leve");
        }
    }

    private static void AddWindRisk(
        WeatherData weather,
        ref int score,
        ICollection<string> reasons)
    {
        if (weather.WindSpeedKph >= 60)
        {
            score += 4;
            reasons.Add("vento muito forte");
            return;
        }

        if (weather.WindSpeedKph >= 40)
        {
            score += 2;
            reasons.Add("vento forte");
            return;
        }

        if (weather.WindSpeedKph >= 25)
        {
            score += 1;
            reasons.Add("vento moderado");
        }
    }

    private static void AddVisibilityRisk(
        WeatherData weather,
        ref int score,
        ICollection<string> reasons)
    {
        if (weather.VisibilityKm <= 1)
        {
            score += 4;
            reasons.Add("visibilidade muito baixa");
            return;
        }

        if (weather.VisibilityKm <= 5)
        {
            score += 2;
            reasons.Add("visibilidade reduzida");
            return;
        }

        if (weather.VisibilityKm <= 10)
        {
            score += 1;
            reasons.Add("visibilidade parcialmente reduzida");
        }
    }

    private static void AddTemperatureRisk(
        WeatherData weather,
        ref int score,
        ICollection<string> reasons)
    {
        if (weather.TemperatureCelsius >= 40)
        {
            score += 3;
            reasons.Add("temperatura extremamente alta");
            return;
        }

        if (weather.TemperatureCelsius >= 35)
        {
            score += 2;
            reasons.Add("temperatura muito alta");
            return;
        }

        if (weather.TemperatureCelsius >= 32)
        {
            score += 1;
            reasons.Add("temperatura elevada");
            return;
        }

        if (weather.TemperatureCelsius <= 0)
        {
            score += 3;
            reasons.Add("temperatura igual ou inferior a zero");
            return;
        }

        if (weather.TemperatureCelsius <= 5)
        {
            score += 1;
            reasons.Add("temperatura baixa");
        }
    }

    private static void AddSnowRisk(
        WeatherData weather,
        ref int score,
        ICollection<string> reasons)
    {
        if (weather.SnowMillimeters >= 10)
        {
            score += 4;
            reasons.Add("neve intensa");
            return;
        }

        if (weather.SnowMillimeters > 0)
        {
            score += 2;
            reasons.Add("presença de neve");
        }
    }

    private static string GetRiskLevel(int score)
    {
        return score switch
        {
            <= 3 => "Low",
            <= 6 => "Moderate",
            _ => "High"
        };
    }

    private static string CreateSummary(
        string level,
        IReadOnlyCollection<string> reasons)
    {
        if (reasons.Count == 0)
        {
            return "Condições climáticas favoráveis para o trajeto.";
        }

        var prefix = level switch
        {
            "High" => "Risco climático alto",
            "Moderate" => "Risco climático moderado",
            _ => "Risco climático baixo"
        };

        return $"{prefix}: {string.Join(", ", reasons)}.";
    }
}