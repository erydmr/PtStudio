using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class SettingService
{
    private readonly AppDbContext _context;
    private readonly ILogger<SettingService> _logger;

    public SettingService(AppDbContext context, ILogger<SettingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<SettingDto>> GetAllAsync()
    {
        var settings = await _context.Settings.OrderBy(s => s.Key).ToListAsync();
        return settings.Select(s => new SettingDto
        {
            Id = s.Id,
            Key = s.Key,
            Value = s.Value,
            Description = s.Description
        }).ToList();
    }

    public async Task<(SettingDto? Result, string? Error)> UpdateAsync(int id, SettingUpdateDto dto, int updatedByUserId)
    {
        var setting = await _context.Settings.FindAsync(id);
        if (setting == null)
            return (null, "Ayar bulunamadi.");

        var oldValue = setting.Value;
        setting.Value = dto.Value;

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = updatedByUserId,
            Action = AuditAction.Updated,
            EntityType = nameof(Setting),
            EntityId = setting.Id,
            Details = JsonConvert.SerializeObject(new { setting.Key, OldValue = oldValue, NewValue = dto.Value }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return (new SettingDto
        {
            Id = setting.Id,
            Key = setting.Key,
            Value = setting.Value,
            Description = setting.Description
        }, null);
    }
}
