using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;
using PtStudio.Api.Models;

namespace PtStudio.Api.Services;

public class AttendanceService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AttendanceService> _logger;

    public AttendanceService(AppDbContext context, ILogger<AttendanceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<(CheckInResponseDto? Result, string? Error)> CheckInAsync(int userId, CheckInDto dto)
    {
        var studioToken = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "StudioQrToken");
        if (studioToken == null || studioToken.Value != dto.StudioToken)
            return (null, "Gecersiz QR kodu.");

        var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.IsActive);
        if (client == null)
            return (null, "Musteri profili bulunamadi.");

        var now = DateTime.UtcNow;
        var windowStart = now.AddMinutes(-15);
        var windowEnd = now.AddMinutes(15);

        var appointmentClient = await _context.AppointmentClients
            .Include(ac => ac.Appointment).ThenInclude(a => a.Trainer).ThenInclude(t => t.User)
            .Include(ac => ac.Client).ThenInclude(c => c.User)
            .Include(ac => ac.Attendance)
            .Where(ac => ac.ClientId == client.Id
                && ac.Status == AppointmentClientStatus.Scheduled
                && ac.Appointment.Status == AppointmentStatus.Scheduled
                && ac.Appointment.StartTime >= windowStart
                && ac.Appointment.StartTime <= windowEnd
                && ac.Attendance == null)
            .OrderBy(ac => ac.Appointment.StartTime)
            .FirstOrDefaultAsync();

        if (appointmentClient == null)
            return (null, "Su an check-in yapilabilecek bir dersiniz bulunamadi. Ders saatine ±15 dakika icerisinde check-in yapabilirsiniz.");

        var attendance = new Attendance
        {
            AppointmentClientId = appointmentClient.Id,
            CheckInTime = now,
            Method = AttendanceMethod.QR
        };

        _context.Attendances.Add(attendance);

        appointmentClient.Status = AppointmentClientStatus.Completed;

        var clientPackage = await _context.ClientPackages.FindAsync(appointmentClient.ClientPackageId);
        if (clientPackage != null && clientPackage.RemainingSessions > 0)
        {
            clientPackage.RemainingSessions--;
            if (clientPackage.RemainingSessions == 0)
                clientPackage.Status = PackageStatus.Completed;
        }

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = AuditAction.Created,
            EntityType = nameof(Attendance),
            EntityId = attendance.Id,
            Details = JsonConvert.SerializeObject(new { appointmentClient.AppointmentId, appointmentClient.ClientId, Method = "QR" }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return (new CheckInResponseDto
        {
            AttendanceId = attendance.Id,
            ClientFullName = appointmentClient.Client.User.FullName,
            TrainerFullName = appointmentClient.Appointment.Trainer.User.FullName,
            StartTime = appointmentClient.Appointment.StartTime,
            EndTime = appointmentClient.Appointment.EndTime,
            Method = AttendanceMethod.QR.ToString()
        }, null);
    }

    public async Task<(CheckInResponseDto? Result, string? Error)> ManualCheckInAsync(int appointmentClientId, int adminUserId)
    {
        var appointmentClient = await _context.AppointmentClients
            .Include(ac => ac.Appointment).ThenInclude(a => a.Trainer).ThenInclude(t => t.User)
            .Include(ac => ac.Client).ThenInclude(c => c.User)
            .Include(ac => ac.Attendance)
            .FirstOrDefaultAsync(ac => ac.Id == appointmentClientId);

        if (appointmentClient == null)
            return (null, "Kayit bulunamadi.");

        if (appointmentClient.Attendance != null)
            return (null, "Bu musteri zaten check-in yapmis.");

        if (appointmentClient.Status != AppointmentClientStatus.Scheduled)
            return (null, "Sadece planlanmis dersler icin check-in yapilabilir.");

        var now = DateTime.UtcNow;

        var attendance = new Attendance
        {
            AppointmentClientId = appointmentClient.Id,
            CheckInTime = now,
            Method = AttendanceMethod.Manual
        };

        _context.Attendances.Add(attendance);

        appointmentClient.Status = AppointmentClientStatus.Completed;

        var clientPackage = await _context.ClientPackages.FindAsync(appointmentClient.ClientPackageId);
        if (clientPackage != null && clientPackage.RemainingSessions > 0)
        {
            clientPackage.RemainingSessions--;
            if (clientPackage.RemainingSessions == 0)
                clientPackage.Status = PackageStatus.Completed;
        }

        await _context.SaveChangesAsync();

        _context.AuditLogs.Add(new AuditLog
        {
            UserId = adminUserId,
            Action = AuditAction.Created,
            EntityType = nameof(Attendance),
            EntityId = attendance.Id,
            Details = JsonConvert.SerializeObject(new { appointmentClient.AppointmentId, appointmentClient.ClientId, Method = "Manual" }),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return (new CheckInResponseDto
        {
            AttendanceId = attendance.Id,
            ClientFullName = appointmentClient.Client.User.FullName,
            TrainerFullName = appointmentClient.Appointment.Trainer.User.FullName,
            StartTime = appointmentClient.Appointment.StartTime,
            EndTime = appointmentClient.Appointment.EndTime,
            Method = AttendanceMethod.Manual.ToString()
        }, null);
    }

    public async Task<(int BurnedCount, string? Error)> BurnNoShowsAsync(int adminUserId)
    {
        var now = DateTime.UtcNow;

        var noShows = await _context.AppointmentClients
            .Include(ac => ac.Appointment)
            .Include(ac => ac.ClientPackage)
            .Where(ac => ac.Status == AppointmentClientStatus.Scheduled
                && ac.Appointment.Status == AppointmentStatus.Scheduled
                && ac.Appointment.EndTime < now
                && ac.Attendance == null)
            .ToListAsync();

        foreach (var ac in noShows)
        {
            ac.Status = AppointmentClientStatus.Burned;

            if (ac.ClientPackage.RemainingSessions > 0)
            {
                ac.ClientPackage.RemainingSessions--;
                if (ac.ClientPackage.RemainingSessions == 0)
                    ac.ClientPackage.Status = PackageStatus.Completed;
            }
        }

        if (noShows.Count > 0)
        {
            var appointmentIds = noShows.Select(ac => ac.AppointmentId).Distinct().ToList();
            var appointments = await _context.Appointments
                .Include(a => a.AppointmentClients)
                .Where(a => appointmentIds.Contains(a.Id))
                .ToListAsync();

            foreach (var appointment in appointments)
            {
                var allDone = appointment.AppointmentClients.All(ac =>
                    ac.Status == AppointmentClientStatus.Completed ||
                    ac.Status == AppointmentClientStatus.Burned ||
                    ac.Status == AppointmentClientStatus.Cancelled);

                if (allDone)
                    appointment.Status = AppointmentStatus.Completed;
            }

            await _context.SaveChangesAsync();

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = adminUserId,
                Action = AuditAction.Updated,
                EntityType = nameof(AppointmentClient),
                EntityId = 0,
                Details = JsonConvert.SerializeObject(new { Action = "BurnNoShows", BurnedCount = noShows.Count, AppointmentClientIds = noShows.Select(ac => ac.Id) }),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        return (noShows.Count, null);
    }
}
