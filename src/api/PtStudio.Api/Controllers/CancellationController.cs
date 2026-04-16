using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CancellationController : ControllerBase
{
    private readonly CancellationService _cancellationService;

    public CancellationController(CancellationService cancellationService)
    {
        _cancellationService = cancellationService;
    }

    [HttpPost("{appointmentClientId}")]
    public async Task<IActionResult> Cancel(int appointmentClientId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (success, error) = await _cancellationService.CancelAsync(appointmentClientId, userId);

        if (!success && error != null && !error.Contains("Gec iptal"))
            return BadRequest(new { message = error });

        if (error != null && error.Contains("Gec iptal"))
            return Ok(new { success = true, burned = true, message = error });

        return Ok(new { success = true, burned = false, message = "Ders basariyla iptal edildi. Hakkiniz iade edildi." });
    }
}
