using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Services.Interfaces
{
    public interface IPower
    {
        Task<AnalyzeResponse> ProcessAsync(AnalyzeDTO model);
    }
}