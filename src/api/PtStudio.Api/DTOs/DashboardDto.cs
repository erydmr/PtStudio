namespace PtStudio.Api.DTOs;

public class DashboardDto
{
    public int TodayLessonCount { get; set; }
    public int TodayCompletedCount { get; set; }
    public int TodayBurnedCount { get; set; }
    public int ActiveClientCount { get; set; }
    public int ActiveTrainerCount { get; set; }
    public int ActivePackageCount { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public decimal PreviousMonthRevenue { get; set; }
    public int MonthlyNewClientCount { get; set; }
    public int MonthlyCancelledCount { get; set; }
    public int MonthlyBurnedCount { get; set; }
    public int MonthlyCompletedCount { get; set; }
    public double CancellationRate { get; set; }
    public List<UpcomingLessonDto> UpcomingLessons { get; set; } = new();
}

public class UpcomingLessonDto
{
    public int AppointmentId { get; set; }
    public string TrainerFullName { get; set; } = null!;
    public string? TrainerColor { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int ClientCount { get; set; }
    public int Capacity { get; set; }
    public bool IsGroup { get; set; }
}
