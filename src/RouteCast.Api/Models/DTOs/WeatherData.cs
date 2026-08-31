namespace RouteCast.Api.Models.DTOs;

public class WeatherData
{
    public DateTime DateTime { get; set; }

    public double TemperatureCelsius { get; set; }

    public double HumidityPercent { get; set; }

    public double PrecipitationMillimeters { get; set; }

    public double PrecipitationProbabilityPercent { get; set; }

    public double WindSpeedKph { get; set; }

    public double VisibilityKm { get; set; }

    public double SnowMillimeters { get; set; }

    public string Conditions { get; set; } = string.Empty;
}