namespace RouteCast.Api.Models.DTOs;

public class RouteSample
{
    public int CoordinateIndex { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double AccumulatedDistanceMeters { get; set; }

    public int AccumulatedDurationSeconds { get; set; }

    public DateTime EstimatedArrivalTime { get; set; }
}