namespace RouteCast.Api.Models.DTOs;

public class RouteGeometryResult
{
    public string GeoJson { get; set; } = string.Empty;

    public List<Coordinate> Coordinates { get; set; } = new();

    public int DistanceMeters { get; set; }

    public int DurationSeconds { get; set; }
}