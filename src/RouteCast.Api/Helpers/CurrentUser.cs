using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using RouteCast.Api.Data;
using RouteCast.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace RouteCast.Api.Helpers
{
    public static class CurrentUser
    {
        private static IHttpContextAccessor? _httpContextAccessor;
        private static IServiceProvider? _serviceProvider;
        private static User? _cachedUser;

        public static void Initialize(IHttpContextAccessor httpContextAccessor, IServiceProvider serviceProvider)
        {
            _httpContextAccessor = httpContextAccessor;
            _serviceProvider = serviceProvider;
        }

        public static Guid? Id
        {
            get
            {
                if (_httpContextAccessor?.HttpContext == null)
                    return null;

                var userIdClaim = _httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
                return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId) ? userId : null;
            }
        }

        public static string? Name => _httpContextAccessor?.HttpContext?.User.FindFirst(ClaimTypes.Name)?.Value;

        public static string? Email => _httpContextAccessor?.HttpContext?.User.FindFirst(ClaimTypes.Email)?.Value;

        public static User? Current
        {
            get
            {
                if (Id == null || _serviceProvider == null)
                    return null;

                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<RouteCastDbContext>();
                _cachedUser = dbContext.Users.FirstOrDefault(u => u.Id == Id);
                
                return _cachedUser;
            }
        }

        public static void Reset()
        {
            _cachedUser = null;
        }
    }
}