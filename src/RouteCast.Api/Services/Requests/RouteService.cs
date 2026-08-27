using Microsoft.Extensions.Configuration;
using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;
using System.Text;
using System.Text.Json;

namespace RouteCast.Api.Services.Requests
{
    public class RouteService : IRouteService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public RouteService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;

            _apiKey = configuration["OpenRouteService:ApiKey"]
                ?? throw new ArgumentNullException("OpenRouteService API key is missing");

            _httpClient.BaseAddress = new Uri("https://api.openrouteservice.org/");
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        }

        /// <summary>
        /// Obtém todas as coordenadas (latitude, longitude) da rota entre dois pontos
        /// </summary>
        public async Task<MapsData> GetRouteCoordinatesAsync(double latOrigin, double longOrigin, double latDestination, double longDestination, string transportType)
        {
            MapsData mapsData = new MapsData();
            var coordinates = new List<double[]>
            {
                new double[] { longOrigin, latOrigin },
                new double[] { longDestination, latDestination }
            };

            // Captura o tipo de transporte (carro, bike, pé)
            var profile = MapTransportType(transportType);

            var requestBody = new
            {
                coordinates,
                format = "geojson"
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            
            // MUDANÇA 1: A URL agora é dinâmica e usa a variável {profile} em vez de "driving-car" fixo
            var response = await _httpClient.PostAsync($"v2/directions/{profile}/geojson", content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            mapsData.json = json;

            var routeResponse = JsonSerializer.Deserialize<RouteResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            mapsData.Coordinates = ExtractCoordinates(routeResponse);
            return mapsData;
        }

        // MUDANÇA 2: Adicionado '?' (RouteResponse?) para resolver o Warning do compilador (CS8604)
        private List<Coordinate> ExtractCoordinates(RouteResponse? response)
        {
            var coordinates = new List<Coordinate>();

            if (response?.Features?.FirstOrDefault()?.Geometry?.Coordinates == null)
                return coordinates;

            foreach (var coord in response.Features[0].Geometry.Coordinates)
            {
                if (coord.Length >= 2)
                {
                    // ORS retorna [longitude, latitude]
                    coordinates.Add(new Coordinate(coord[1], coord[0]));
                }
            }

            return coordinates;
        }

        private string MapTransportType(string transportType)
        {
            return transportType.ToLower() switch
            {
                "car" => "driving-car",
                "bike" => "cycling-regular",
                "foot" => "foot-walking",
                _ => "driving-car"
            };
        }
    }

    // Classes simples para deserialização
    public class RouteResponse
    {
        public List<Feature> Features { get; set; } = new();
    }

    public class Feature
    {
        public Geometry Geometry { get; set; } = new();
    }

    public class Geometry
    {
        public string Type { get; set; } = string.Empty;
        public List<double[]> Coordinates { get; set; } = new();
    }
}