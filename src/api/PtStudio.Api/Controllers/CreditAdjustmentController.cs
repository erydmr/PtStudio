using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.DTOs;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class CreditAdjustmentController : ControllerBase
{
    private readonly CreditAdjustmentService _creditAdjustmentService;

    public CreditAdjustmentController(CreditAdjustmentService creditAdjustmentService)
    {
        _creditAdjustmentService = creditAdjustmentService;
    }

    [HttpGet("by-clientpackage/{clientPackageId}")]
    public async Task<IActionResult> GetByClientPackage(int clientPackageId)
    {
        var result = await _creditAdjustmentService.GetByClientPackageIdAsync(clientPackageId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreditAdjustmentCreateDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (result, error) = await _creditAdjustmentService.CreateAsync(dto, userId);

        if (error != null)
            return BadRequest(new { message = error });

        return Ok(result);
    }
}
