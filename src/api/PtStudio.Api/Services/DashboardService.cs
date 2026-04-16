using Microsoft.EntityFrameworkCore;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;

namespace PtStudio.Api.Services;

public class DashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);
        var prevMonthStart = monthStart.AddMonths(-1);

        var todayAppointments = await _context.Appointments
            .Include(a => a.AppointmentClients)
            .Where(a => a.StartTime >= todayStart && a.StartTime < todayEnd && a.Status != AppointmentStatus.Cancelled)
            .ToListAsync();

        var todayLessonCount = todayAppointments.Count;
        var todayCompletedCount = todayAppointments
            .SelectMany(a => a.AppointmentClients)
            .Count(ac => ac.Status == AppointmentClientStatus.Completed);
        var todayBurnedCount = todayAppointments
            .SelectMany(a => a.AppointmentClients)
            .Count(ac => ac.Status == AppointmentClientStatus.Burned);

        var activeClientCount = await _context.Clients.CountAsync(c => c.IsActive);
        var activeTrainerCount = await _context.Trainers.CountAsync(t => t.IsActive);
        var activePackageCount = await _context.ClientPackages.CountAsync(cp => cp.Status == PackageStatus.Active);

        var monthlyRevenue = await _context.ClientPackages
            .Include(cp => cp.Package)
            .Where(cp => cp.PurchaseDate >= monthStart && cp.PurchaseDate < monthEnd)
            .SumAsync(cp => cp.Package.Price);

        var previousMonthRevenue = await _context.ClientPackages
            .Include(cp => cp.Package)
            .Where(cp => cp.PurchaseDate >= prevMonthStart && cp.PurchaseDate < monthStart)
            .SumAsync(cp => cp.Package.Price);

        var monthlyNewClientCount = await _context.Clients
            .Include(c => c.User)
            .CountAsync(c => c.User.CreatedAt >= monthStart && c.User.CreatedAt < monthEnd);

        var monthlyAppointmentClients = await _context.AppointmentClients
            .Include(ac => ac.Appointment)
            .Where(ac => ac.Appointment.StartTime >= monthStart && ac.Appointment.StartTime < monthEnd)
            .ToListAsync();

        var monthlyCompletedCount = monthlyAppointmentClients.Count(ac => ac.Status == AppointmentClientStatus.Completed);
        var monthlyCancelledCount = monthlyAppointmentClients.Count(ac => ac.Status == AppointmentClientStatus.Cancelled);
        var monthlyBurnedCount = monthlyAppointmentClients.Count(ac => ac.Status == AppointmentClientStatus.Burned);

        var totalMonthly = monthlyAppointmentClients.Count;
        var cancellationRate = totalMonthly > 0 ? (double)(monthlyCancelledCount + monthlyBurnedCount) / totalMonthly * 100 : 0;

        var upcomingLessons = await _context.Appointments
            .Include(a => a.Trainer).ThenInclude(t => t.User)
            .Include(a => a.AppointmentClients)
            .Where(a => a.StartTime >= now && a.StartTime < todayEnd && a.Status == AppointmentStatus.Scheduled)
            .OrderBy(a => a.StartTime)
            .Take(10)
            .Select(a => new UpcomingLessonDto
            {
                AppointmentId = a.Id,
                TrainerFullName = a.Trainer.User.FullName,
                TrainerColor = a.Trainer.Color,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                ClientCount = a.AppointmentClients.Count(ac => ac.Status == AppointmentClientStatus.Scheduled),
                Capacity = a.Capacity,
                IsGroup = a.IsGroup
            })
            .ToListAsync();

        return new DashboardDto
        {
            TodayLessonCount = todayLessonCount,
            TodayCompletedCount = todayCompletedCount,
            TodayBurnedCount = todayBurnedCount,
            ActiveClientCount = activeClientCount,
            ActiveTrainerCount = activeTrainerCount,
            ActivePackageCount = activePackageCount,
            MonthlyRevenue = monthlyRevenue,
            PreviousMonthRevenue = previousMonthRevenue,
            MonthlyNewClientCount = monthlyNewClientCount,
            MonthlyCancelledCount = monthlyCancelledCount,
            MonthlyBurnedCount = monthlyBurnedCount,
            MonthlyCompletedCount = monthlyCompletedCount,
            CancellationRate = Math.Round(cancellationRate, 1),
            UpcomingLessons = upcomingLessons
        };
    }
}
