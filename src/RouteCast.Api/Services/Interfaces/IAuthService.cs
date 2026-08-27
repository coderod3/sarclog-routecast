using RouteCast.Api.Models.DTOs;

namespace RouteCast.Api.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse?> Login(LoginRequest request);
        Task<bool> Register(RegisterRequest request);
    }
}