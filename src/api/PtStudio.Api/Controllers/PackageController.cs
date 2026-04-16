using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class PackageController : ControllerBase
{
    private readonly PackageService _packageService;

    public PackageController(PackageService packageService)
    {
        _packageService = packageService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll()
    {
        var packages = await _packageService.GetAllAsync();
        return Ok(packages);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var package = await _packageService.GetByIdAsync(id);
        if (package == null)
            return NotFound(new { message = "Paket bulunamadi." });

        return Ok(package);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PackageCreateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _packageService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PackageUpdateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _packageService.UpdateAsync(id, dto, userId);

        if (result == null)
            return NotFound(new { message = "Paket bulunamadi." });

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _packageService.DeleteAsync(id, userId);

        if (!result)
            return NotFound(new { message = "Paket bulunamadi." });

        return NoContent();
    }
}
