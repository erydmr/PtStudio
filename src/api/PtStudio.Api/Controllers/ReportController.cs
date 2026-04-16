using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PtStudio.Api.Services;

namespace PtStudio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportController : ControllerBase
{
    private readonly ReportService _reportService;
    private readonly ExcelExportService _excelExportService;

    public ReportController(ReportService reportService, ExcelExportService excelExportService)
    {
        _reportService = reportService;
        _excelExportService = excelExportService;
    }

    [HttpGet("trainers")]
    public async Task<IActionResult> GetTrainerReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var result = await _reportService.GetTrainerReportAsync(from, to);
        return Ok(result);
    }

    [HttpGet("clients")]
    public async Task<IActionResult> GetClientReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var result = await _reportService.GetClientReportAsync(from, to);
        return Ok(result);
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenueReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var result = await _reportService.GetRevenueReportAsync(from, to);
        return Ok(result);
    }

    [HttpGet("cancellations")]
    public async Task<IActionResult> GetCancellationReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var result = await _reportService.GetCancellationReportAsync(from, to);
        return Ok(result);
    }

    [HttpGet("trainers/export")]
    public async Task<IActionResult> ExportTrainerReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var data = await _reportService.GetTrainerReportAsync(from, to);
        var bytes = _excelExportService.ExportTrainerReport(data, from, to);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"antrenor-raporu-{from:yyyyMMdd}-{to:yyyyMMdd}.xlsx");
    }

    [HttpGet("clients/export")]
    public async Task<IActionResult> ExportClientReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var data = await _reportService.GetClientReportAsync(from, to);
        var bytes = _excelExportService.ExportClientReport(data, from, to);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"musteri-raporu-{from:yyyyMMdd}-{to:yyyyMMdd}.xlsx");
    }

    [HttpGet("revenue/export")]
    public async Task<IActionResult> ExportRevenueReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var data = await _reportService.GetRevenueReportAsync(from, to);
        var bytes = _excelExportService.ExportRevenueReport(data, from, to);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"gelir-raporu-{from:yyyyMMdd}-{to:yyyyMMdd}.xlsx");
    }

    [HttpGet("cancellations/export")]
    public async Task<IActionResult> ExportCancellationReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var data = await _reportService.GetCancellationReportAsync(from, to);
        var bytes = _excelExportService.ExportCancellationReport(data, from, to);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"iptal-yanma-raporu-{from:yyyyMMdd}-{to:yyyyMMdd}.xlsx");
    }
}
