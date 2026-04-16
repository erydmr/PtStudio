using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrainerController : ControllerBase
{
    private readonly TrainerService _trainerService;

    public TrainerController(TrainerService trainerService)
    {
        _trainerService = trainerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var trainers = await _trainerService.GetAllAsync();
        return Ok(trainers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var trainer = await _trainerService.GetByIdAsync(id);
        if (trainer == null)
            return NotFound(new { message = "Antrenor bulunamadi." });

        return Ok(trainer);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] TrainerUpdateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _trainerService.UpdateAsync(id, dto, userId);

        if (result == null)
            return NotFound(new { message = "Antrenor bulunamadi." });

        return Ok(result);
    }
}
