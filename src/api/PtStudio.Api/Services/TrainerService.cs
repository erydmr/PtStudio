using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class TrainerService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<TrainerService> _logger;

    public TrainerService(AppDbContext context, IMapper mapper, ILogger<TrainerService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<TrainerDto>> GetAllAsync()
    {
        var trainers = await _context.Trainers
            .Include(t => t.User)
            .Where(t => t.IsActive && t.User.IsActive)
            .OrderBy(t => t.User.FullName)
            .ToListAsync();

        return _mapper.Map<List<TrainerDto>>(trainers);
    }

    public async Task<TrainerDto?> GetByIdAsync(int id)
    {
        var trainer = await _context.Trainers
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

        return trainer == null ? null : _mapper.Map<TrainerDto>(trainer);
    }

    public async Task<TrainerDto?> UpdateAsync(int id, TrainerUpdateDto dto, int updatedByUserId)
    {
        var trainer = await _context.Trainers
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

        if (trainer == null)
            return null;

        trainer.Specialization = dto.Specialization;
        trainer.Color = dto.Color;
        trainer.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = updatedByUserId,
            Action = AuditAction.Updated,
            EntityType = nameof(Trainer),
            EntityId = trainer.Id,
            Details = JsonConvert.SerializeObject(dto),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return _mapper.Map<TrainerDto>(trainer);
    }
}
