using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PtStudio.Api.Data;
using PtStudio.Api.DTOs;
using PtStudio.Api.Enums;

namespace PtStudio.Api.Services;

public class ReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    private static readonly CultureInfo TrCulture = new("tr-TR");

    private static DateTime ToUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dt, DateTimeKind.Utc) : dt.ToUniversalTime();

    public async Task<List<TrainerReportDto>> GetTrainerReportAsync(DateTime from, DateTime to)
    {
        var trainers = await _context.Trainers
            .Include(t => t.User)
            .Where(t => t.IsActive)
            .ToListAsync();

        var appointmentClients = await _context.AppointmentClients
            .Include(ac => ac.Appointment)
            .Where(ac => ac.Appointment.StartTime >= ToUtc(from) && ac.Appointment.StartTime <= ToUtc(to))
            .ToListAsync();

        return trainers.Select(t =>
        {
            var trainerAcs = appointmentClients.Where(ac => ac.Appointment.TrainerId == t.Id).ToList();
            var total = trainerAcs.Count;
            var completed = trainerAcs.Count(ac => ac.Status == AppointmentClientStatus.Completed);
            var cancelled = trainerAcs.Count(ac => ac.Status == AppointmentClientStatus.Cancelled);
            var burned = trainerAcs.Count(ac => ac.Status == AppointmentClientStatus.Burned);
            var uniqueClients = trainerAcs.Select(ac => ac.ClientId).Distinct().Count();

            return new TrainerReportDto
            {
                TrainerId = t.Id,
                TrainerFullName = t.User.FullName,
                Color = t.Color,
                TotalLessons = total,
                CompletedLessons = completed,
                CancelledLessons = cancelled,
                BurnedLessons = burned,
                UniqueClientCount = uniqueClients,
                CompletionRate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0
            };
        })
        .OrderByDescending(r => r.TotalLessons)
        .ToList();
    }

    public async Task<List<ClientReportDto>> GetClientReportAsync(DateTime from, DateTime to)
    {
        var clients = await _context.Clients
            .Include(c => c.User)
            .Include(c => c.ClientPackages)
            .Where(c => c.IsActive)
            .ToListAsync();

        var appointmentClients = await _context.AppointmentClients
            .Include(ac => ac.Appointment)
            .Where(ac => ac.Appointment.StartTime >= ToUtc(from) && ac.Appointment.StartTime <= ToUtc(to))
            .ToListAsync();

        return clients.Select(c =>
        {
            var clientAcs = appointmentClients.Where(ac => ac.ClientId == c.Id).ToList();

            return new ClientReportDto
            {
                ClientId = c.Id,
                ClientFullName = c.User.FullName,
                TotalLessons = clientAcs.Count,
                CompletedLessons = clientAcs.Count(ac => ac.Status == AppointmentClientStatus.Completed),
                CancelledLessons = clientAcs.Count(ac => ac.Status == AppointmentClientStatus.Cancelled),
                BurnedLessons = clientAcs.Count(ac => ac.Status == AppointmentClientStatus.Burned),
                TotalRemainingSessions = c.ClientPackages.Where(cp => cp.Status == PackageStatus.Active).Sum(cp => cp.RemainingSessions),
                ActivePackageCount = c.ClientPackages.Count(cp => cp.Status == PackageStatus.Active)
            };
        })
        .OrderByDescending(r => r.TotalLessons)
        .ToList();
    }

    public async Task<List<RevenueReportDto>> GetRevenueReportAsync(DateTime from, DateTime to)
    {
        var clientPackages = await _context.ClientPackages
            .Include(cp => cp.Package)
            .Where(cp => cp.PurchaseDate >= ToUtc(from) && cp.PurchaseDate <= ToUtc(to))
            .ToListAsync();

        return clientPackages
            .GroupBy(cp => new { cp.PurchaseDate.Year, cp.PurchaseDate.Month })
            .Select(g => new RevenueReportDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM yyyy", TrCulture),
                Revenue = g.Sum(cp => cp.Package.Price),
                PackagesSold = g.Count()
            })
            .OrderBy(r => r.Year)
            .ThenBy(r => r.Month)
            .ToList();
    }

    public async Task<List<CancellationReportDto>> GetCancellationReportAsync(DateTime from, DateTime to)
    {
        var appointmentClients = await _context.AppointmentClients
            .Include(ac => ac.Appointment)
            .Where(ac => ac.Appointment.StartTime >= ToUtc(from) && ac.Appointment.StartTime <= ToUtc(to))
            .ToListAsync();

        return appointmentClients
            .GroupBy(ac => new { ac.Appointment.StartTime.Year, ac.Appointment.StartTime.Month })
            .Select(g =>
            {
                var total = g.Count();
                var completed = g.Count(ac => ac.Status == AppointmentClientStatus.Completed);
                var cancelled = g.Count(ac => ac.Status == AppointmentClientStatus.Cancelled);
                var burned = g.Count(ac => ac.Status == AppointmentClientStatus.Burned);

                return new CancellationReportDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMMM yyyy", TrCulture),
                    TotalLessons = total,
                    CompletedLessons = completed,
                    CancelledLessons = cancelled,
                    BurnedLessons = burned,
                    CancellationRate = total > 0 ? Math.Round((double)cancelled / total * 100, 1) : 0,
                    BurnRate = total > 0 ? Math.Round((double)burned / total * 100, 1) : 0
                };
            })
            .OrderBy(r => r.Year)
            .ThenBy(r => r.Month)
            .ToList();
    }
}
