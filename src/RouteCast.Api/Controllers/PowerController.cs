using Microsoft.AspNetCore.Mvc;
using RouteCast.Api.Models.DTOs;
using RouteCast.Api.Services.Interfaces;

namespace RouteCast.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PowerController : ControllerBase
    {
        private readonly IPower _power;

        public PowerController(IPower power)
        {
            _power = power;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze([FromBody] AnalyzeDTO model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // serializa o objeto AnalyzeResponse automaticamente em JSON
                var result = await _power.ProcessAsync(model);
                
                if (result == null)
                    return NotFound(new { message = "Nenhum dado retornado." });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Erro ao processar requisição.",
                    error = ex.Message
                });
            }
        }

        [HttpPost("ping")]
        public IActionResult TestRoute()
        {
            return Ok(new { message = "Pong", date = DateTime.UtcNow });
        }
    }
}