using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SettingController : ControllerBase
{
    private readonly SettingService _settingService;

    public SettingController(SettingService settingService)
    {
        _settingService = settingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _settingService.GetAllAsync();
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SettingUpdateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (result, error) = await _settingService.UpdateAsync(id, dto, userId);

        if (error != null)
            return NotFound(new { message = error });

        return Ok(result);
    }
}
