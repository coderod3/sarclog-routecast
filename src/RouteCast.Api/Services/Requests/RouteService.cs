using System.Globalization;
using System.Text.Json;
using RouteCast.Api.Helpers;
using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services.Requests;

public class RouteService : IRouteService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public RouteService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;

        _apiKey = configuration["HereMaps:ApiKey"]
            ?? throw new InvalidOperationException(
                "HERE Maps API key não configurada.");

        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException(
                "HERE Maps API key não configurada.");
        }

        _httpClient.BaseAddress = new Uri(
            "https://router.hereapi.com/");
    }

    public async Task<RouteGeometryResult> GetRouteCoordinatesAsync(
        double latOrigin,
        double longOrigin,
        double latDestination,
        double longDestination,
        string transportType)
    {
        var hereTransportMode = MapTransportType(transportType);

        var origin =
            $"{latOrigin.ToString(CultureInfo.InvariantCulture)}," +
            $"{longOrigin.ToString(CultureInfo.InvariantCulture)}";

        var destination =
            $"{latDestination.ToString(CultureInfo.InvariantCulture)}," +
            $"{longDestination.ToString(CultureInfo.InvariantCulture)}";

        var requestUrl =
            "v8/routes" +
            $"?transportMode={Uri.EscapeDataString(hereTransportMode)}" +
            $"&origin={Uri.EscapeDataString(origin)}" +
            $"&destination={Uri.EscapeDataString(destination)}" +
            "&return=summary,polyline" +
            $"&apiKey={Uri.EscapeDataString(_apiKey)}";

        using var response = await _httpClient.GetAsync(requestUrl);

        var responseContent =
            await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"HERE Routing retornou HTTP {(int)response.StatusCode}: " +
                responseContent);
        }

        var hereResponse =
            JsonSerializer.Deserialize<HereRouteResponse>(
                responseContent,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

        var sections = hereResponse?
            .Routes
            .FirstOrDefault()?
            .Sections;

        if (sections is null || sections.Count == 0)
        {
            throw new InvalidOperationException(
                "A HERE não retornou uma rota.");
        }

        var coordinates = new List<Coordinate>();

        foreach (var section in sections)
        {
            if (string.IsNullOrWhiteSpace(section.Polyline))
                continue;

            var decodedCoordinates =
                FlexiblePolylineDecoder.Decode(section.Polyline);

            foreach (var coordinate in decodedCoordinates)
            {
                var isDuplicate =
                    coordinates.Count > 0 &&
                    coordinates[^1].Latitude == coordinate.Latitude &&
                    coordinates[^1].Longitude == coordinate.Longitude;

                if (!isDuplicate)
                {
                    coordinates.Add(coordinate);
                }
            }
        }

        if (coordinates.Count == 0)
        {
            throw new InvalidOperationException(
                "Não foi possível decodificar a geometria da rota.");
        }

        var distanceMeters = sections.Sum(
            section => section.Summary?.Length ?? 0);

        var durationSeconds = sections.Sum(
            section => section.Summary?.Duration ?? 0);

        if (distanceMeters <= 0 || durationSeconds <= 0)
        {
            throw new InvalidOperationException(
                "A HERE retornou distância ou duração inválida.");
        }

        var geoJson = CreateGeoJson(coordinates);

        return new RouteGeometryResult
        {
            GeoJson = geoJson,
            Coordinates = coordinates,
            DistanceMeters = distanceMeters,
            DurationSeconds = durationSeconds
        };
    }

    private static string MapTransportType(string transportType)
    {
        return transportType.Trim().ToLowerInvariant() switch
        {
            "car" => "car",
            "motorcycle" => "scooter",
            "bicycle" => "bicycle",
            "bike" => "bicycle",
            "walking" => "pedestrian",
            "foot" => "pedestrian",
            _ => "car"
        };
    }

    private static string CreateGeoJson(
        IReadOnlyCollection<Coordinate> coordinates)
    {
        var geoJson = new
        {
            type = "FeatureCollection",
            features = new[]
            {
                new
                {
                    type = "Feature",
                    properties = new { },
                    geometry = new
                    {
                        type = "LineString",

                        // GeoJSON utiliza [longitude, latitude].
                        coordinates = coordinates.Select(
                            coordinate => new[]
                            {
                                coordinate.Longitude,
                                coordinate.Latitude
                            })
                    }
                }
            }
        };

        return JsonSerializer.Serialize(geoJson);
    }
}

public class HereRouteResponse
{
    public List<HereRoute> Routes { get; set; } = [];
}

public class HereRoute
{
    public List<HereSection> Sections { get; set; } = [];
}

public class HereSection
{
    public string Polyline { get; set; } = string.Empty;

    public HereSectionSummary? Summary { get; set; }
}

public class HereSectionSummary
{
    public int Duration { get; set; }

    public int Length { get; set; }

    public int BaseDuration { get; set; }
}