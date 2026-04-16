using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly AttendanceService _attendanceService;

    public AttendanceController(AttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    [HttpPost("checkin")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (result, error) = await _attendanceService.CheckInAsync(userId, dto);

        if (error != null)
            return BadRequest(new { message = error });

        return Ok(result);
    }

    [HttpPost("manual-checkin/{appointmentClientId}")]
    [Authorize(Roles = "Admin,Trainer")]
    public async Task<IActionResult> ManualCheckIn(int appointmentClientId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (result, error) = await _attendanceService.ManualCheckInAsync(appointmentClientId, userId);

        if (error != null)
            return BadRequest(new { message = error });

        return Ok(result);
    }

    [HttpPost("burn-noshows")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BurnNoShows()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (burnedCount, error) = await _attendanceService.BurnNoShowsAsync(userId);

        if (error != null)
            return BadRequest(new { message = error });

        return Ok(new { burnedCount, message = $"{burnedCount} ders yandi olarak isaretlendi." });
    }
}
