using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientPackageController : ControllerBase
{
    private readonly ClientPackageService _clientPackageService;

    public ClientPackageController(ClientPackageService clientPackageService)
    {
        _clientPackageService = clientPackageService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _clientPackageService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMy()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _clientPackageService.GetByUserIdAsync(userId);
        return Ok(result);
    }

    [HttpGet("by-client/{clientId}")]
    public async Task<IActionResult> GetByClientId(int clientId)
    {
        var result = await _clientPackageService.GetByClientIdAsync(clientId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _clientPackageService.GetByIdAsync(id);
        if (result == null)
            return NotFound(new { message = "Musteri paketi bulunamadi." });

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] ClientPackageCreateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _clientPackageService.CreateAsync(dto, userId);

        if (result == null)
            return BadRequest(new { message = "Musteri veya paket bulunamadi." });

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] ClientPackageStatusUpdateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _clientPackageService.UpdateStatusAsync(id, dto, userId);

        if (result == null)
            return NotFound(new { message = "Musteri paketi bulunamadi." });

        return Ok(result);
    }
}
