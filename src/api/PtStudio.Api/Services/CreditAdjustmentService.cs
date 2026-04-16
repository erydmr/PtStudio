using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class CreditAdjustmentService
{
    private readonly AppDbContext _context;
    private readonly ILogger<CreditAdjustmentService> _logger;

    public CreditAdjustmentService(AppDbContext context, ILogger<CreditAdjustmentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<CreditAdjustmentDto>> GetByClientPackageIdAsync(int clientPackageId)
    {
        var adjustments = await _context.CreditAdjustments
            .Include(ca => ca.ClientPackage).ThenInclude(cp => cp.Client).ThenInclude(c => c.User)
            .Include(ca => ca.ClientPackage).ThenInclude(cp => cp.Package)
            .Include(ca => ca.AdjustedByUser)
            .Where(ca => ca.ClientPackageId == clientPackageId)
            .OrderByDescending(ca => ca.CreatedAt)
            .ToListAsync();

        return adjustments.Select(MapToDto).ToList();
    }

    public async Task<(CreditAdjustmentDto? Result, string? Error)> CreateAsync(CreditAdjustmentCreateDto dto, int adjustedByUserId)
    {
        var clientPackage = await _context.ClientPackages
            .Include(cp => cp.Client).ThenInclude(c => c.User)
            .Include(cp => cp.Package)
            .FirstOrDefaultAsync(cp => cp.Id == dto.ClientPackageId);

        if (clientPackage == null)
            return (null, "Musteri paketi bulunamadi.");

        clientPackage.RemainingSessions += dto.Amount;
        if (clientPackage.RemainingSessions < 0)
            clientPackage.RemainingSessions = 0;

        if (clientPackage.RemainingSessions > 0 && clientPackage.Status == PackageStatus.Completed)
            clientPackage.Status = PackageStatus.Active;

        var adjustment = new CreditAdjustment
        {
            ClientPackageId = dto.ClientPackageId,
            Amount = dto.Amount,
            Reason = dto.Reason,
            AdjustedByUserId = adjustedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.CreditAdjustments.Add(adjustment);
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = adjustedByUserId,
            Action = AuditAction.Created,
            EntityType = nameof(CreditAdjustment),
            EntityId = adjustment.Id,
            Details = JsonConvert.SerializeObject(new { dto.ClientPackageId, dto.Amount, dto.Reason, NewRemaining = clientPackage.RemainingSessions }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _context.CreditAdjustments
            .Include(ca => ca.ClientPackage).ThenInclude(cp => cp.Client).ThenInclude(c => c.User)
            .Include(ca => ca.ClientPackage).ThenInclude(cp => cp.Package)
            .Include(ca => ca.AdjustedByUser)
            .FirstAsync(ca => ca.Id == adjustment.Id);

        return (MapToDto(result), null);
    }

    private static CreditAdjustmentDto MapToDto(CreditAdjustment ca)
    {
        return new CreditAdjustmentDto
        {
            Id = ca.Id,
            ClientPackageId = ca.ClientPackageId,
            ClientFullName = ca.ClientPackage.Client.User.FullName,
            PackageName = ca.ClientPackage.Package.Name,
            Amount = ca.Amount,
            Reason = ca.Reason,
            AdjustedByFullName = ca.AdjustedByUser.FullName,
            CreatedAt = ca.CreatedAt
        };
    }
}
