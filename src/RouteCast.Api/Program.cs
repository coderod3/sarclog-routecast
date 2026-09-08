using Microsoft.OpenApi.Models;
using RouteCast.Api.Data.Config;
using RouteCast.Api.Helpers;
using RouteCast.Api.Middlewares;
using RouteCast.Api.Services;
using RouteCast.Api.Services.Interfaces;
using RouteCast.Api.Services.Requests;

var builder = WebApplication.CreateBuilder(args);

/*
 * Configuração local opcional para desenvolvimento.
 *
 * O arquivo appsettings.Local.json não é versionado.
 * Variáveis de ambiente são adicionadas novamente depois dele
 * para continuarem tendo prioridade no Heroku e em outros ambientes.
 */
builder.Configuration
    .AddJsonFile(
        "appsettings.Local.json",
        optional: true,
        reloadOnChange: false)
    .AddEnvironmentVariables();

builder.Services.AddDatabaseConfiguration(
    builder.Configuration);

builder.Services.AddHttpContextAccessor();

builder.Services.ConfigureJwtAuthentication(
    builder.Configuration);

builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<BaseApiClient>();

builder.Services.AddScoped<
    IRouteAnalysisService,
    RouteAnalysisService>();

builder.Services.AddScoped<
    IRouteSamplingService,
    RouteSamplingService>();

builder.Services.AddScoped<
    IWeatherRiskService,
    WeatherRiskService>();

builder.Services.AddHttpClient<
    IRouteService,
    RouteService>();

builder.Services.AddHttpClient<
    IWeatherService,
    VisualCrossingService>();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            null;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "ProductionPolicy",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:5175",
                    "https://sarclog-routecast.vercel.app")
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "RouteCast API",
            Version = "v1",
            Description = "API para o projeto RouteCast"
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Description =
                "JWT Authorization header usando o esquema Bearer. " +
                "Exemplo: \"Authorization: Bearer {token}\"",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
});

var app = builder.Build();

var httpContextAccessor =
    app.Services.GetRequiredService<IHttpContextAccessor>();

CurrentUser.Initialize(
    httpContextAccessor,
    app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "RouteCast API v1");
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("ProductionPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();