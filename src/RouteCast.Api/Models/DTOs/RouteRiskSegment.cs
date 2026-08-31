namespace RouteCast.Api.Models.DTOs;

public class RouteRiskSegment
{
    public int StartCoordinateIndex { get; set; }

    public int EndCoordinateIndex { get; set; }

    public double StartDistanceMeters { get; set; }

    public double EndDistanceMeters { get; set; }

    public DateTime EstimatedArrivalTime { get; set; }

    public int RiskScore { get; set; }

    public string RiskLevel { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public WeatherData Weather { get; set; } = new();
}