using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class PackageService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<PackageService> _logger;

    public PackageService(AppDbContext context, IMapper mapper, ILogger<PackageService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<PackageDto>> GetAllAsync()
    {
        var packages = await _context.Packages
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return _mapper.Map<List<PackageDto>>(packages);
    }

    public async Task<PackageDto?> GetByIdAsync(int id)
    {
        var package = await _context.Packages
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

        return package == null ? null : _mapper.Map<PackageDto>(package);
    }

    public async Task<PackageDto> CreateAsync(PackageCreateDto dto, int createdByUserId)
    {
        var package = new Package
        {
            Name = dto.Name,
            SessionCount = dto.SessionCount,
            DefaultDurationMinutes = dto.DefaultDurationMinutes,
            MaxDays = dto.MaxDays,
            Price = dto.Price,
            IsActive = true
        };

        _context.Packages.Add(package);
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = createdByUserId,
            Action = AuditAction.Created,
            EntityType = nameof(Package),
            EntityId = package.Id,
            Details = JsonConvert.SerializeObject(dto),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return _mapper.Map<PackageDto>(package);
    }

    public async Task<PackageDto?> UpdateAsync(int id, PackageUpdateDto dto, int updatedByUserId)
    {
        var package = await _context.Packages.FindAsync(id);
        if (package == null || !package.IsActive)
            return null;

        package.Name = dto.Name;
        package.SessionCount = dto.SessionCount;
        package.DefaultDurationMinutes = dto.DefaultDurationMinutes;
        package.MaxDays = dto.MaxDays;
        package.Price = dto.Price;
        package.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = updatedByUserId,
            Action = AuditAction.Updated,
            EntityType = nameof(Package),
            EntityId = package.Id,
            Details = JsonConvert.SerializeObject(dto),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return _mapper.Map<PackageDto>(package);
    }

    public async Task<bool> DeleteAsync(int id, int deletedByUserId)
    {
        var package = await _context.Packages.FindAsync(id);
        if (package == null || !package.IsActive)
            return false;

        package.IsActive = false;
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = deletedByUserId,
            Action = AuditAction.Deleted,
            EntityType = nameof(Package),
            EntityId = package.Id,
            Details = JsonConvert.SerializeObject(new { package.Name }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return true;
    }
}
