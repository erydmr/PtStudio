using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class ClientService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ClientService> _logger;

    public ClientService(AppDbContext context, IMapper mapper, ILogger<ClientService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<ClientDto>> GetAllAsync()
    {
        var clients = await _context.Clients
            .Include(c => c.User)
            .Where(c => c.IsActive && c.User.IsActive)
            .OrderBy(c => c.User.FullName)
            .ToListAsync();

        return _mapper.Map<List<ClientDto>>(clients);
    }

    public async Task<ClientDto?> GetByIdAsync(int id)
    {
        var client = await _context.Clients
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

        return client == null ? null : _mapper.Map<ClientDto>(client);
    }

    public async Task<ClientDto?> UpdateAsync(int id, ClientUpdateDto dto, int updatedByUserId)
    {
        var client = await _context.Clients
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

        if (client == null)
            return null;

        client.Notes = dto.Notes;
        client.EmergencyContact = dto.EmergencyContact;
        client.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = updatedByUserId,
            Action = AuditAction.Updated,
            EntityType = nameof(Client),
            EntityId = client.Id,
            Details = JsonConvert.SerializeObject(dto),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return _mapper.Map<ClientDto>(client);
    }
}
