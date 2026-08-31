using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Services.Interfaces
{
    public interface IRouteAnalysisService
    {
        Task<AnalyzeResponse> ProcessAsync(AnalyzeDTO model);
    }
}