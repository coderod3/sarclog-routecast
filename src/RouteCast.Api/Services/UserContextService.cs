using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RouteCast.Api.Data;
using RouteCast.Api.Models;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services
{
    public class UserContextService : IUserContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly RouteCastDbContext _dbContext;
        private User? _cachedUser;

        public UserContextService(IHttpContextAccessor httpContextAccessor, RouteCastDbContext dbContext)
        {
            _httpContextAccessor = httpContextAccessor;
            _dbContext = dbContext;
        }

        public User? CurrentUser => _cachedUser ??= GetCurrentUserAsync().GetAwaiter().GetResult();

        public Guid? CurrentUserId
        {
            get
            {
                var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier);
                return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId) ? userId : null;
            }
        }

        public async Task<User?> GetCurrentUserAsync()
        {
            if (_cachedUser != null)
                return _cachedUser;

            var userId = CurrentUserId;
            if (userId == null)
                return null;

            _cachedUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            return _cachedUser;
        }
    }
}