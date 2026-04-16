using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class ClientPackageService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ClientPackageService> _logger;

    public ClientPackageService(AppDbContext context, IMapper mapper, ILogger<ClientPackageService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<ClientPackageDto>> GetAllAsync()
    {
        var clientPackages = await _context.ClientPackages
            .Include(cp => cp.Client).ThenInclude(c => c.User)
            .Include(cp => cp.Package)
            .OrderByDescending(cp => cp.PurchaseDate)
            .ToListAsync();

        return _mapper.Map<List<ClientPackageDto>>(clientPackages);
    }

    public async Task<List<ClientPackageDto>> GetByClientIdAsync(int clientId)
    {
        var clientPackages = await _context.ClientPackages
            .Include(cp => cp.Client).ThenInclude(c => c.User)
            .Include(cp => cp.Package)
            .Where(cp => cp.ClientId == clientId)
            .OrderByDescending(cp => cp.PurchaseDate)
            .ToListAsync();

        return _mapper.Map<List<ClientPackageDto>>(clientPackages);
    }

    public async Task<List<ClientPackageDto>> GetByUserIdAsync(int userId)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId);
        if (client == null) return new List<ClientPackageDto>();
        return await GetByClientIdAsync(client.Id);
    }

    public async Task<ClientPackageDto?> GetByIdAsync(int id)
    {
        var clientPackage = await _context.ClientPackages
            .Include(cp => cp.Client).ThenInclude(c => c.User)
            .Include(cp => cp.Package)
            .FirstOrDefaultAsync(cp => cp.Id == id);

        return clientPackage == null ? null : _mapper.Map<ClientPackageDto>(clientPackage);
    }

    public async Task<ClientPackageDto?> CreateAsync(ClientPackageCreateDto dto, int createdByUserId)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(c => c.Id == dto.ClientId && c.IsActive);
        if (client == null)
            return null;

        var package = await _context.Packages
            .FirstOrDefaultAsync(p => p.Id == dto.PackageId && p.IsActive);
        if (package == null)
            return null;

        var now = DateTime.UtcNow;
        var clientPackage = new ClientPackage
        {
            ClientId = dto.ClientId,
            PackageId = dto.PackageId,
            RemainingSessions = package.SessionCount,
            PurchaseDate = now,
            ExpiryDate = package.MaxDays.HasValue ? now.AddDays(package.MaxDays.Value) : null,
            Status = PackageStatus.Active
        };

        _context.ClientPackages.Add(clientPackage);
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = createdByUserId,
            Action = AuditAction.Created,
            EntityType = nameof(ClientPackage),
            EntityId = clientPackage.Id,
            Details = JsonConvert.SerializeObject(new { dto.ClientId, dto.PackageId, package.Name, clientPackage.RemainingSessions, clientPackage.ExpiryDate }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _context.ClientPackages
            .Include(cp => cp.Client).ThenInclude(c => c.User)
            .Include(cp => cp.Package)
            .FirstAsync(cp => cp.Id == clientPackage.Id);

        return _mapper.Map<ClientPackageDto>(result);
    }

    public async Task<ClientPackageDto?> UpdateStatusAsync(int id, ClientPackageStatusUpdateDto dto, int updatedByUserId)
    {
        var clientPackage = await _context.ClientPackages
            .Include(cp => cp.Client).ThenInclude(c => c.User)
            .Include(cp => cp.Package)
            .FirstOrDefaultAsync(cp => cp.Id == id);

        if (clientPackage == null)
            return null;

        clientPackage.Status = dto.Status;
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = updatedByUserId,
            Action = AuditAction.Updated,
            EntityType = nameof(ClientPackage),
            EntityId = clientPackage.Id,
            Details = JsonConvert.SerializeObject(new { NewStatus = dto.Status.ToString() }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return _mapper.Map<ClientPackageDto>(clientPackage);
    }
}
