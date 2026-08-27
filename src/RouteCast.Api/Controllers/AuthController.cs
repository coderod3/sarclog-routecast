using Microsoft.AspNetCore.Mvc;
using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var response = await _authService.Login(request);
            if (response == null)
                return Unauthorized(new { message = "Email ou senha inválidos" });

            // Configurar o cookie com o token JWT
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddHours(3),
                Path = "/"
            };
            
            Response.Cookies.Append("auth_token", response.Token, cookieOptions);

            return Ok(new{ message = "Login realizado com sucesso" });
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        {
            var response = await _authService.Register(request);

            if (!response)
            {
                return BadRequest(new { message = "Novo usuário não foi criado" });
            }
            
            return Ok(new { message = "Novo usuário criado com sucesso" });
        }

        [HttpPost("logout")]
        public ActionResult Logout()
        {
            // Remove o cookie de autenticação
            Response.Cookies.Delete("auth_token", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/"
            });

            return Ok(new { message = "Logout realizado com sucesso" });
        }
    }
}
