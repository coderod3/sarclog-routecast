using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RouteCast.Api.Services.Interfaces;
using RouteCast.Api.Helpers;

namespace RouteCast.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        [HttpGet("me")]
        public ActionResult GetProfile()
        {
            // Usando a classe estática CurrentUser
            var user = CurrentUser.Current;
            if (user == null)
                return Unauthorized();

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Role
            });
        }
    }
}