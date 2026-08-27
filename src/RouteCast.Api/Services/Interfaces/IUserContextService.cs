using RouteCast.Api.Models;

namespace RouteCast.Api.Services.Interfaces
{
    public interface IUserContextService
    {
        User? CurrentUser { get; }
        Guid? CurrentUserId { get; }
        Task<User?> GetCurrentUserAsync();
    }
}