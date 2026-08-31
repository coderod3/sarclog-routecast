using System.Globalization;
using System.Net;
using System.Text.Json;
using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Models.External;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services.Requests;

public class VisualCrossingService : IWeatherService
{
    private const int MaximumAttempts = 3;

    private readonly HttpClient _httpClient;
    private readonly ILogger<VisualCrossingService> _logger;
    private readonly string _apiKey;

    public VisualCrossingService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<VisualCrossingService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _apiKey = configuration["VisualCrossing:ApiKey"]
            ?? throw new InvalidOperationException(
                "Visual Crossing API key não configurada.");

        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException(
                "Visual Crossing API key não configurada.");
        }

        var baseUrl = configuration["VisualCrossing:BaseUrl"];

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException(
                "VisualCrossing:BaseUrl não configurada.");
        }

        _httpClient.BaseAddress = new Uri(baseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<WeatherData> GetWeatherAsync(
        RouteSample sample,
        CancellationToken cancellationToken = default)
    {
        var requestUrl = CreateRequestUrl(sample);

        using var response = await SendWithRetryAsync(
            requestUrl,
            sample,
            cancellationToken);

        var responseContent =
            await response.Content.ReadAsStringAsync(
                cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "Visual Crossing retornou HTTP {StatusCode}. " +
                "Coordenada: {Latitude}, {Longitude}. ETA: {Eta}. " +
                "Resposta: {ResponseContent}",
                (int)response.StatusCode,
                sample.Latitude,
                sample.Longitude,
                sample.EstimatedArrivalTime,
                responseContent);

            throw CreateProviderException(
                response.StatusCode);
        }

        VisualCrossingResponse? weatherResponse;

        try
        {
            weatherResponse =
                JsonSerializer.Deserialize<VisualCrossingResponse>(
                    responseContent,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
        }
        catch (JsonException ex)
        {
            _logger.LogError(
                ex,
                "Resposta JSON inválida da Visual Crossing. " +
                "Coordenada: {Latitude}, {Longitude}. ETA: {Eta}",
                sample.Latitude,
                sample.Longitude,
                sample.EstimatedArrivalTime);

            throw new InvalidOperationException(
                "A Visual Crossing retornou dados inválidos.",
                ex);
        }

        var hours = weatherResponse?
            .Days
            .SelectMany(day => day.Hours)
            .ToList();

        if (hours is null || hours.Count == 0)
        {
            throw new InvalidOperationException(
                "A Visual Crossing não retornou previsão horária.");
        }

        var estimatedArrivalUtc =
            sample.EstimatedArrivalTime.ToUniversalTime();

        var closestHour = hours
            .OrderBy(hour =>
            {
                var hourUtc = DateTimeOffset
                    .FromUnixTimeSeconds(hour.DatetimeEpoch)
                    .UtcDateTime;

                return Math.Abs(
                    (hourUtc - estimatedArrivalUtc).TotalSeconds);
            })
            .First();

        var selectedTimeUtc = DateTimeOffset
            .FromUnixTimeSeconds(closestHour.DatetimeEpoch)
            .UtcDateTime;

        return new WeatherData
        {
            DateTime = selectedTimeUtc,
            TemperatureCelsius = closestHour.Temp ?? 0,
            HumidityPercent = closestHour.Humidity ?? 0,
            PrecipitationMillimeters = closestHour.Precip ?? 0,
            PrecipitationProbabilityPercent =
                closestHour.Precipprob ?? 0,
            WindSpeedKph = closestHour.Windspeed ?? 0,
            VisibilityKm = closestHour.Visibility ?? 0,
            SnowMillimeters = closestHour.Snow ?? 0,
            Conditions = closestHour.Conditions
        };
    }

    private async Task<HttpResponseMessage> SendWithRetryAsync(
        string requestUrl,
        RouteSample sample,
        CancellationToken cancellationToken)
    {
        for (var attempt = 1;
             attempt <= MaximumAttempts;
             attempt++)
        {
            try
            {
                var response = await _httpClient.GetAsync(
                    requestUrl,
                    cancellationToken);

                if (!IsTransientStatusCode(response.StatusCode))
                {
                    return response;
                }

                if (attempt == MaximumAttempts)
                {
                    return response;
                }

                var delay = GetRetryDelay(
                    response,
                    attempt);

                _logger.LogWarning(
                    "Visual Crossing retornou HTTP {StatusCode}. " +
                    "Tentativa {Attempt}/{MaximumAttempts}. " +
                    "Nova tentativa em {DelaySeconds} segundos. " +
                    "Coordenada: {Latitude}, {Longitude}",
                    (int)response.StatusCode,
                    attempt,
                    MaximumAttempts,
                    delay.TotalSeconds,
                    sample.Latitude,
                    sample.Longitude);

                response.Dispose();

                await Task.Delay(
                    delay,
                    cancellationToken);
            }
            catch (TaskCanceledException ex)
                when (!cancellationToken.IsCancellationRequested)
            {
                if (attempt == MaximumAttempts)
                {
                    _logger.LogError(
                        ex,
                        "Timeout ao consultar a Visual Crossing após " +
                        "{MaximumAttempts} tentativas. " +
                        "Coordenada: {Latitude}, {Longitude}. ETA: {Eta}",
                        MaximumAttempts,
                        sample.Latitude,
                        sample.Longitude,
                        sample.EstimatedArrivalTime);

                    throw new TimeoutException(
                        "A consulta climática excedeu o tempo limite.",
                        ex);
                }

                var delay = GetDefaultRetryDelay(attempt);

                _logger.LogWarning(
                    "Timeout na Visual Crossing. " +
                    "Tentativa {Attempt}/{MaximumAttempts}. " +
                    "Nova tentativa em {DelaySeconds} segundos.",
                    attempt,
                    MaximumAttempts,
                    delay.TotalSeconds);

                await Task.Delay(
                    delay,
                    cancellationToken);
            }
            catch (HttpRequestException ex)
            {
                if (attempt == MaximumAttempts)
                {
                    _logger.LogError(
                        ex,
                        "Falha de rede ao consultar a Visual Crossing " +
                        "após {MaximumAttempts} tentativas. " +
                        "Coordenada: {Latitude}, {Longitude}",
                        MaximumAttempts,
                        sample.Latitude,
                        sample.Longitude);

                    throw;
                }

                var delay = GetDefaultRetryDelay(attempt);

                _logger.LogWarning(
                    ex,
                    "Falha temporária de rede na Visual Crossing. " +
                    "Tentativa {Attempt}/{MaximumAttempts}. " +
                    "Nova tentativa em {DelaySeconds} segundos.",
                    attempt,
                    MaximumAttempts,
                    delay.TotalSeconds);

                await Task.Delay(
                    delay,
                    cancellationToken);
            }
        }

        throw new InvalidOperationException(
            "Não foi possível concluir a consulta climática.");
    }

    private string CreateRequestUrl(RouteSample sample)
    {
        var latitude = sample.Latitude.ToString(
            CultureInfo.InvariantCulture);

        var longitude = sample.Longitude.ToString(
            CultureInfo.InvariantCulture);

        var location = $"{latitude},{longitude}";

        var requestedDate = sample.EstimatedArrivalTime
            .ToUniversalTime()
            .ToString(
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture);

        var elements = string.Join(
            ",",
            "datetime",
            "datetimeEpoch",
            "temp",
            "humidity",
            "precip",
            "precipprob",
            "snow",
            "windspeed",
            "visibility",
            "conditions");

        return
            $"{Uri.EscapeDataString(location)}/" +
            $"{requestedDate}" +
            "?unitGroup=metric" +
            "&include=hours" +
            $"&elements={Uri.EscapeDataString(elements)}" +
            $"&key={Uri.EscapeDataString(_apiKey)}" +
            "&contentType=json";
    }

    private static bool IsTransientStatusCode(
        HttpStatusCode statusCode)
    {
        return
            statusCode == HttpStatusCode.TooManyRequests ||
            statusCode == HttpStatusCode.RequestTimeout ||
            statusCode == HttpStatusCode.InternalServerError ||
            statusCode == HttpStatusCode.BadGateway ||
            statusCode == HttpStatusCode.ServiceUnavailable ||
            statusCode == HttpStatusCode.GatewayTimeout;
    }

    private static TimeSpan GetRetryDelay(
        HttpResponseMessage response,
        int attempt)
    {
        if (response.Headers.RetryAfter?.Delta is not null)
        {
            return response.Headers.RetryAfter.Delta.Value;
        }

        if (response.Headers.RetryAfter?.Date is not null)
        {
            var delay =
                response.Headers.RetryAfter.Date.Value -
                DateTimeOffset.UtcNow;

            if (delay > TimeSpan.Zero)
            {
                return delay;
            }
        }

        return GetDefaultRetryDelay(attempt);
    }

    private static TimeSpan GetDefaultRetryDelay(int attempt)
    {
        return TimeSpan.FromSeconds(
            Math.Pow(2, attempt));
    }

    private static Exception CreateProviderException(
        HttpStatusCode statusCode)
    {
        return statusCode switch
        {
            HttpStatusCode.Unauthorized =>
                new InvalidOperationException(
                    "A autenticação da Visual Crossing falhou."),

            HttpStatusCode.Forbidden =>
                new InvalidOperationException(
                    "O acesso à Visual Crossing foi negado."),

            HttpStatusCode.TooManyRequests =>
                new InvalidOperationException(
                    "O limite de consultas climáticas foi atingido."),

            HttpStatusCode.BadRequest =>
                new InvalidOperationException(
                    "A Visual Crossing rejeitou os dados da consulta."),

            HttpStatusCode.RequestTimeout =>
                new TimeoutException(
                    "A Visual Crossing demorou demais para responder."),

            HttpStatusCode.InternalServerError or
            HttpStatusCode.BadGateway or
            HttpStatusCode.ServiceUnavailable or
            HttpStatusCode.GatewayTimeout =>
                new HttpRequestException(
                    "A Visual Crossing está temporariamente indisponível."),

            _ =>
                new HttpRequestException(
                    $"A Visual Crossing retornou HTTP " +
                    $"{(int)statusCode}.")
        };
    }
}