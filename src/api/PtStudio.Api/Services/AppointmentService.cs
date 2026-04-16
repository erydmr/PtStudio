using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class AppointmentService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AppointmentService> _logger;

    public AppointmentService(AppDbContext context, ILogger<AppointmentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<AppointmentDto>> GetAllAsync(DateTime? from, DateTime? to, int? trainerId, int? clientId)
    {
        var query = _context.Appointments
            .Include(a => a.Trainer).ThenInclude(t => t.User)
            .Include(a => a.AppointmentClients).ThenInclude(ac => ac.Client).ThenInclude(c => c.User)
            .Where(a => a.Status != AppointmentStatus.Cancelled)
            .AsQueryable();

        if (from.HasValue) query = query.Where(a => a.StartTime >= ToUtc(from.Value));
        if (to.HasValue) query = query.Where(a => a.StartTime <= ToUtc(to.Value));
        if (trainerId.HasValue) query = query.Where(a => a.TrainerId == trainerId.Value);
        if (clientId.HasValue) query = query.Where(a => a.AppointmentClients.Any(ac => ac.ClientId == clientId.Value));

        var appointments = await query.OrderBy(a => a.StartTime).ToListAsync();
        return appointments.Select(MapToDto).ToList();
    }

    public async Task<List<AppointmentDto>> GetByUserIdAsync(int userId, DateTime? from, DateTime? to)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId);
        if (client == null) return new List<AppointmentDto>();
        return await GetAllAsync(from, to, null, client.Id);
    }

    public async Task<AppointmentDto?> GetByIdAsync(int id)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Trainer).ThenInclude(t => t.User)
            .Include(a => a.AppointmentClients).ThenInclude(ac => ac.Client).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        return appointment == null ? null : MapToDto(appointment);
    }

    public async Task<(AppointmentDto? Result, string? Error)> CreateAsync(AppointmentCreateDto dto, int createdByUserId)
    {
        var conflictError = await CheckTrainerConflict(dto.TrainerId, dto.StartTime, dto.EndTime, null);
        if (conflictError != null) return (null, conflictError);

        var capacityError = ValidateCapacity(dto.Capacity, dto.IsGroup, dto.Clients.Count);
        if (capacityError != null) return (null, capacityError);

        var appointment = new Appointment
        {
            TrainerId = dto.TrainerId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Capacity = dto.Capacity,
            IsGroup = dto.IsGroup,
            Status = AppointmentStatus.Scheduled,
            Notes = dto.Notes
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        foreach (var c in dto.Clients)
        {
            _context.AppointmentClients.Add(new AppointmentClient
            {
                AppointmentId = appointment.Id,
                ClientId = c.ClientId,
                ClientPackageId = c.ClientPackageId,
                Status = AppointmentClientStatus.Scheduled
            });
        }
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = createdByUserId,
            Action = AuditAction.Created,
            EntityType = nameof(Appointment),
            EntityId = appointment.Id,
            Details = JsonConvert.SerializeObject(new { dto.TrainerId, dto.StartTime, dto.EndTime, ClientCount = dto.Clients.Count }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(appointment.Id), null);
    }

    public async Task<(List<AppointmentDto>? Result, string? Error)> CreateRecurringAsync(RecurringAppointmentCreateDto dto, int createdByUserId)
    {
        var recurrenceGroupId = Guid.NewGuid();
        var created = new List<AppointmentDto>();

        for (int week = 0; week < dto.Weeks; week++)
        {
            foreach (var day in dto.Days)
            {
                var baseDate = dto.StartDate.AddDays(week * 7);
                var daysUntilTarget = ((int)day - (int)baseDate.DayOfWeek + 7) % 7;
                var targetDate = baseDate.AddDays(daysUntilTarget);

                if (targetDate < dto.StartDate) continue;

                var startTime = DateTime.SpecifyKind(targetDate.Date + dto.StartTimeOfDay, DateTimeKind.Utc);
                var endTime = DateTime.SpecifyKind(targetDate.Date + dto.EndTimeOfDay, DateTimeKind.Utc);

                var conflict = await CheckTrainerConflict(dto.TrainerId, startTime, endTime, null);
                if (conflict != null) continue;

                var appointment = new Appointment
                {
                    TrainerId = dto.TrainerId,
                    StartTime = startTime,
                    EndTime = endTime,
                    Capacity = dto.Capacity,
                    IsGroup = dto.IsGroup,
                    Status = AppointmentStatus.Scheduled,
                    Notes = dto.Notes,
                    RecurrenceGroupId = recurrenceGroupId
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                foreach (var c in dto.Clients)
                {
                    _context.AppointmentClients.Add(new AppointmentClient
                    {
                        AppointmentId = appointment.Id,
                        ClientId = c.ClientId,
                        ClientPackageId = c.ClientPackageId,
                        Status = AppointmentClientStatus.Scheduled
                    });
                }
                await _context.SaveChangesAsync();

                var result = await GetByIdAsync(appointment.Id);
                if (result != null) created.Add(result);
            }
        }

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = createdByUserId,
            Action = AuditAction.Created,
            EntityType = nameof(Appointment),
            EntityId = 0,
            Details = JsonConvert.SerializeObject(new { RecurrenceGroupId = recurrenceGroupId, dto.TrainerId, dto.Weeks, dto.Days, Count = created.Count }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return (created, null);
    }

    public async Task<(AppointmentDto? Result, string? Error)> UpdateAsync(int id, AppointmentUpdateDto dto, int updatedByUserId)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return (null, "Randevu bulunamadi.");

        if (dto.StartTime != appointment.StartTime || dto.EndTime != appointment.EndTime)
        {
            var conflict = await CheckTrainerConflict(appointment.TrainerId, dto.StartTime, dto.EndTime, id);
            if (conflict != null) return (null, conflict);
        }

        appointment.StartTime = dto.StartTime;
        appointment.EndTime = dto.EndTime;
        appointment.Capacity = dto.Capacity;
        appointment.IsGroup = dto.IsGroup;
        appointment.Notes = dto.Notes;
        appointment.Status = dto.Status;

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = updatedByUserId,
            Action = AuditAction.Updated,
            EntityType = nameof(Appointment),
            EntityId = appointment.Id,
            Details = JsonConvert.SerializeObject(dto),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(id), null);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(int id, bool deleteAll, int deletedByUserId)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null) return (false, "Randevu bulunamadi.");

        if (deleteAll && appointment.RecurrenceGroupId.HasValue)
        {
            var group = await _context.Appointments
                .Where(a => a.RecurrenceGroupId == appointment.RecurrenceGroupId && a.Status == AppointmentStatus.Scheduled)
                .ToListAsync();

            foreach (var a in group)
                a.Status = AppointmentStatus.Cancelled;

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = deletedByUserId,
                Action = AuditAction.Deleted,
                EntityType = nameof(Appointment),
                EntityId = id,
                Details = JsonConvert.SerializeObject(new { RecurrenceGroupId = appointment.RecurrenceGroupId, CancelledCount = group.Count }),
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            appointment.Status = AppointmentStatus.Cancelled;

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = deletedByUserId,
                Action = AuditAction.Deleted,
                EntityType = nameof(Appointment),
                EntityId = id,
                Details = JsonConvert.SerializeObject(new { appointment.TrainerId, appointment.StartTime }),
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(AppointmentDto? Result, string? Error)> AddClientAsync(int appointmentId, AppointmentClientCreateDto dto, int addedByUserId)
    {
        var appointment = await _context.Appointments
            .Include(a => a.AppointmentClients)
            .FirstOrDefaultAsync(a => a.Id == appointmentId);

        if (appointment == null) return (null, "Randevu bulunamadi.");
        if (appointment.AppointmentClients.Count(ac => ac.Status == AppointmentClientStatus.Scheduled) >= appointment.Capacity)
            return (null, "Randevu kapasitesi dolu.");

        var exists = appointment.AppointmentClients.Any(ac => ac.ClientId == dto.ClientId && ac.Status == AppointmentClientStatus.Scheduled);
        if (exists) return (null, "Musteri zaten bu randevuya kayitli.");

        _context.AppointmentClients.Add(new AppointmentClient
        {
            AppointmentId = appointmentId,
            ClientId = dto.ClientId,
            ClientPackageId = dto.ClientPackageId,
            Status = AppointmentClientStatus.Scheduled
        });
        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = addedByUserId,
            Action = AuditAction.Updated,
            EntityType = nameof(AppointmentClient),
            EntityId = appointmentId,
            Details = JsonConvert.SerializeObject(new { Action = "AddClient", dto.ClientId }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(appointmentId), null);
    }

    private static DateTime ToUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dt, DateTimeKind.Utc) : dt.ToUniversalTime();

    private async Task<string?> CheckTrainerConflict(int trainerId, DateTime startTime, DateTime endTime, int? excludeAppointmentId)
    {
        var utcStart = ToUtc(startTime);
        var utcEnd = ToUtc(endTime);
        var query = _context.Appointments
            .Where(a => a.TrainerId == trainerId
                && a.Status == AppointmentStatus.Scheduled
                && a.StartTime < utcEnd
                && a.EndTime > utcStart);

        if (excludeAppointmentId.HasValue)
            query = query.Where(a => a.Id != excludeAppointmentId.Value);

        var conflict = await query.AnyAsync();
        return conflict ? "Bu zaman araliginda antrenorun baska bir randevusu var." : null;
    }

    private static string? ValidateCapacity(int capacity, bool isGroup, int clientCount)
    {
        if (clientCount > capacity)
            return $"Musteri sayisi ({clientCount}) kapasiteyi ({capacity}) asiyor.";
        return null;
    }

    private static AppointmentDto MapToDto(Appointment a)
    {
        return new AppointmentDto
        {
            Id = a.Id,
            TrainerId = a.TrainerId,
            TrainerFullName = a.Trainer.User.FullName,
            TrainerColor = a.Trainer.Color,
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            Capacity = a.Capacity,
            IsGroup = a.IsGroup,
            Status = a.Status.ToString(),
            Notes = a.Notes,
            RecurrenceGroupId = a.RecurrenceGroupId,
            Clients = a.AppointmentClients.Select(ac => new AppointmentClientDto
            {
                Id = ac.Id,
                ClientId = ac.ClientId,
                ClientFullName = ac.Client.User.FullName,
                ClientPackageId = ac.ClientPackageId,
                Status = ac.Status.ToString()
            }).ToList()
        };
    }
}
