using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services;

public class RouteSamplingService : IRouteSamplingService
{
    private const double EarthRadiusMeters = 6_371_000;

    private readonly double _samplingDistanceMeters;

    public RouteSamplingService(IConfiguration configuration)
    {
        var samplingDistanceKm =
            configuration.GetValue<double>(
                "RouteAnalysis:SamplingDistanceKm");

        if (samplingDistanceKm <= 0)
        {
            throw new InvalidOperationException(
                "RouteAnalysis:SamplingDistanceKm deve ser maior que zero.");
        }

        _samplingDistanceMeters = samplingDistanceKm * 1_000;
    }

    public List<RouteSample> CreateSamples(
        RouteGeometryResult route,
        DateTime departureTime)
    {
        if (route.Coordinates.Count == 0)
        {
            throw new InvalidOperationException(
                "A rota não possui coordenadas.");
        }

        if (route.DistanceMeters <= 0)
        {
            throw new InvalidOperationException(
                "A distância total da rota deve ser maior que zero.");
        }

        if (route.DurationSeconds <= 0)
        {
            throw new InvalidOperationException(
                "A duração total da rota deve ser maior que zero.");
        }

        var samples = new List<RouteSample>();

        var firstCoordinate = route.Coordinates[0];

        samples.Add(CreateSample(
            coordinateIndex: 0,
            coordinate: firstCoordinate,
            accumulatedDistanceMeters: 0,
            route: route,
            departureTime: departureTime));

        var accumulatedGeometryDistance = 0.0;
        var nextSamplingDistance = _samplingDistanceMeters;

        for (var index = 1; index < route.Coordinates.Count; index++)
        {
            var previousCoordinate = route.Coordinates[index - 1];
            var currentCoordinate = route.Coordinates[index];

            accumulatedGeometryDistance += CalculateDistanceMeters(
                previousCoordinate,
                currentCoordinate);

            if (accumulatedGeometryDistance < nextSamplingDistance)
            {
                continue;
            }

            var normalizedDistance = NormalizeDistance(
                accumulatedGeometryDistance,
                route.DistanceMeters);

            samples.Add(CreateSample(
                coordinateIndex: index,
                coordinate: currentCoordinate,
                accumulatedDistanceMeters: normalizedDistance,
                route: route,
                departureTime: departureTime));

            while (nextSamplingDistance <= accumulatedGeometryDistance)
            {
                nextSamplingDistance += _samplingDistanceMeters;
            }
        }

        AddDestinationIfNecessary(
            samples,
            route,
            departureTime);

        return samples;
    }

    private static RouteSample CreateSample(
        int coordinateIndex,
        Coordinate coordinate,
        double accumulatedDistanceMeters,
        RouteGeometryResult route,
        DateTime departureTime)
    {
        var routeProgress = Math.Clamp(
            accumulatedDistanceMeters / route.DistanceMeters,
            0,
            1);

        var accumulatedDurationSeconds = (int)Math.Round(
            route.DurationSeconds * routeProgress);

        return new RouteSample
        {
            CoordinateIndex = coordinateIndex,
            Latitude = coordinate.Latitude,
            Longitude = coordinate.Longitude,
            AccumulatedDistanceMeters =
                accumulatedDistanceMeters,
            AccumulatedDurationSeconds =
                accumulatedDurationSeconds,
            EstimatedArrivalTime = departureTime.AddSeconds(
                accumulatedDurationSeconds)
        };
    }

    private static void AddDestinationIfNecessary(
        ICollection<RouteSample> samples,
        RouteGeometryResult route,
        DateTime departureTime)
    {
        var destinationIndex = route.Coordinates.Count - 1;
        var destination = route.Coordinates[destinationIndex];
        var lastSample = samples.Last();

        if (lastSample.CoordinateIndex == destinationIndex)
        {
            lastSample.AccumulatedDistanceMeters =
                route.DistanceMeters;

            lastSample.AccumulatedDurationSeconds =
                route.DurationSeconds;

            lastSample.EstimatedArrivalTime =
                departureTime.AddSeconds(route.DurationSeconds);

            return;
        }

        samples.Add(new RouteSample
        {
            CoordinateIndex = destinationIndex,
            Latitude = destination.Latitude,
            Longitude = destination.Longitude,
            AccumulatedDistanceMeters = route.DistanceMeters,
            AccumulatedDurationSeconds = route.DurationSeconds,
            EstimatedArrivalTime =
                departureTime.AddSeconds(route.DurationSeconds)
        });
    }

    private static double NormalizeDistance(
        double geometryDistance,
        double hereDistance)
    {
        return Math.Min(
            geometryDistance,
            hereDistance);
    }

    private static double CalculateDistanceMeters(
        Coordinate origin,
        Coordinate destination)
    {
        var originLatitude =
            DegreesToRadians(origin.Latitude);

        var destinationLatitude =
            DegreesToRadians(destination.Latitude);

        var latitudeDifference = DegreesToRadians(
            destination.Latitude - origin.Latitude);

        var longitudeDifference = DegreesToRadians(
            destination.Longitude - origin.Longitude);

        var haversine =
            Math.Sin(latitudeDifference / 2) *
            Math.Sin(latitudeDifference / 2) +
            Math.Cos(originLatitude) *
            Math.Cos(destinationLatitude) *
            Math.Sin(longitudeDifference / 2) *
            Math.Sin(longitudeDifference / 2);

        var angularDistance = 2 * Math.Atan2(
            Math.Sqrt(haversine),
            Math.Sqrt(1 - haversine));

        return EarthRadiusMeters * angularDistance;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}