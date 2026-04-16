using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class UserService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;

    public UserService(AppDbContext context, IMapper mapper, ILogger<UserService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await _context.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.FullName)
            .ToListAsync();

        return _mapper.Map<List<UserDto>>(users);
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.IsActive);

        return user == null ? null : _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto?> UpdateAsync(int id, UserUpdateDto dto, int updatedByUserId)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || !user.IsActive)
            return null;

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == dto.Email && u.Id != id);
        if (emailExists)
            return null;

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Phone = dto.Phone;
        user.Role = dto.Role;
        user.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = updatedByUserId,
            Action = AuditAction.Updated,
            EntityType = nameof(User),
            EntityId = user.Id,
            Details = JsonConvert.SerializeObject(dto),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task<bool> DeleteAsync(int id, int deletedByUserId)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || !user.IsActive)
            return false;

        user.IsActive = false;

        var trainer = await _context.Trainers.FirstOrDefaultAsync(t => t.UserId == id);
        if (trainer != null)
            trainer.IsActive = false;

        var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == id);
        if (client != null)
            client.IsActive = false;

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = deletedByUserId,
            Action = AuditAction.Deleted,
            EntityType = nameof(User),
            EntityId = user.Id,
            Details = JsonConvert.SerializeObject(new { user.Email, user.Role }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return true;
    }
}
