using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientController : ControllerBase
{
    private readonly ClientService _clientService;

    public ClientController(ClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Trainer")]
    public async Task<IActionResult> GetAll()
    {
        var clients = await _clientService.GetAllAsync();
        return Ok(clients);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var client = await _clientService.GetByIdAsync(id);
        if (client == null)
            return NotFound(new { message = "Musteri bulunamadi." });

        return Ok(client);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ClientUpdateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _clientService.UpdateAsync(id, dto, userId);

        if (result == null)
            return NotFound(new { message = "Musteri bulunamadi." });

        return Ok(result);
    }
}
