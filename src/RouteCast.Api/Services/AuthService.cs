using Microsoft.EntityFrameworkCore;
using RouteCast.Api.Data;
using RouteCast.Api.Helpers;
using RouteCast.Api.Models;
using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly RouteCastDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(RouteCastDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResponse?> Login(LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return null;

            if (!PasswordHelper.VerifyPasswordHash(request.Password, user.PasswordHash))
                return null;

            var token = JwtHelper.GenerateJwtToken(user, _configuration);

            return new AuthResponse
            {
                Token = token,
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email
            };
        }

        public async Task<bool> Register(RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return false;

            var passwordHash = PasswordHelper.HashPassword(request.Password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Email = request.Email,
                PasswordHash = passwordHash
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return true;

        }


    }
}