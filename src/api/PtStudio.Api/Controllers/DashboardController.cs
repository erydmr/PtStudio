using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _dashboardService.GetDashboardAsync();
        return Ok(result);
    }
}
