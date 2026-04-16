using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class CancellationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<CancellationService> _logger;

    public CancellationService(AppDbContext context, ILogger<CancellationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<(bool Success, string? Error)> CancelAsync(int appointmentClientId, int cancelledByUserId)
    {
        var ac = await _context.AppointmentClients
            .Include(x => x.Appointment)
            .Include(x => x.ClientPackage)
            .FirstOrDefaultAsync(x => x.Id == appointmentClientId);

        if (ac == null)
            return (false, "Kayit bulunamadi.");

        if (ac.Status != AppointmentClientStatus.Scheduled)
            return (false, "Sadece planlanmis dersler iptal edilebilir.");

        var now = DateTime.UtcNow;
        var hoursUntilLesson = (ac.Appointment.StartTime - now).TotalHours;

        var setting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "CancellationWindowHours");
        var windowHours = setting != null ? double.Parse(setting.Value) : 6;

        if (hoursUntilLesson >= windowHours)
        {
            ac.Status = AppointmentClientStatus.Cancelled;
            ac.CancelledAt = now;
            ac.CancelledBy = cancelledByUserId;

            if (ac.ClientPackage.RemainingSessions >= 0)
                ac.ClientPackage.RemainingSessions++;

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = cancelledByUserId,
                Action = AuditAction.Updated,
                EntityType = nameof(AppointmentClient),
                EntityId = ac.Id,
                Details = JsonConvert.SerializeObject(new { Action = "Cancel", HoursBeforeLesson = hoursUntilLesson, Refunded = true }),
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            ac.Status = AppointmentClientStatus.Burned;
            ac.CancelledAt = now;
            ac.CancelledBy = cancelledByUserId;

            if (ac.ClientPackage.RemainingSessions > 0)
            {
                ac.ClientPackage.RemainingSessions--;
                if (ac.ClientPackage.RemainingSessions == 0)
                    ac.ClientPackage.Status = PackageStatus.Completed;
            }

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = cancelledByUserId,
                Action = AuditAction.Updated,
                EntityType = nameof(AppointmentClient),
                EntityId = ac.Id,
                Details = JsonConvert.SerializeObject(new { Action = "LateCancelBurned", HoursBeforeLesson = hoursUntilLesson, Refunded = false }),
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        var isOnTime = ac.Status == AppointmentClientStatus.Cancelled;
        return (true, isOnTime ? null : "Gec iptal: Ders hakkiniz yandi.");
    }
}
