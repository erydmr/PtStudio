using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly AppointmentService _appointmentService;

    public AppointmentController(AppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? trainerId,
        [FromQuery] int? clientId)
    {
        var result = await _appointmentService.GetAllAsync(from, to, trainerId, clientId);
        return Ok(result);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMy([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _appointmentService.GetByUserIdAsync(userId, from, to);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _appointmentService.GetByIdAsync(id);
        if (result == null)
            return NotFound(new { message = "Randevu bulunamadi." });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Trainer")]
    public async Task<IActionResult> Create([FromBody] AppointmentCreateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (result, error) = await _appointmentService.CreateAsync(dto, userId);

        if (error != null)
            return BadRequest(new { message = error });

        return CreatedAtAction(nameof(GetById), new { id = result!.Id }, result);
    }

    [HttpPost("recurring")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateRecurring([FromBody] RecurringAppointmentCreateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (result, error) = await _appointmentService.CreateRecurringAsync(dto, userId);

        if (error != null)
            return BadRequest(new { message = error });

        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Trainer")]
    public async Task<IActionResult> Update(int id, [FromBody] AppointmentUpdateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (result, error) = await _appointmentService.UpdateAsync(id, dto, userId);

        if (error != null)
            return BadRequest(new { message = error });

        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool deleteAll = false)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (success, error) = await _appointmentService.DeleteAsync(id, deleteAll, userId);

        if (!success)
            return NotFound(new { message = error });

        return NoContent();
    }

    [HttpPost("{id}/clients")]
    [Authorize(Roles = "Admin,Trainer")]
    public async Task<IActionResult> AddClient(int id, [FromBody] AppointmentClientCreateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (result, error) = await _appointmentService.AddClientAsync(id, dto, userId);

        if (error != null)
            return BadRequest(new { message = error });

        return Ok(result);
    }
}
