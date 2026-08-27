using System.Net.Http;
using System.Text.Json;

namespace RouteCast.Api.Services.Requests
{
    public class BaseApiClient
    {
        private readonly HttpClient _http;

        public BaseApiClient(HttpClient http)
        {
            _http = http;
        }

        public async Task<T?> GetAsync<T>(string url)
        {
            using var response = await _http.GetAsync(url);

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
    }
}
