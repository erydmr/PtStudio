namespace PtStudio.Api.DTOs;

public class TrainerReportDto
{
    public int TrainerId { get; set; }
    public string TrainerFullName { get; set; } = null!;
    public string? Color { get; set; }
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int CancelledLessons { get; set; }
    public int BurnedLessons { get; set; }
    public int UniqueClientCount { get; set; }
    public double CompletionRate { get; set; }
}

public class ClientReportDto
{
    public int ClientId { get; set; }
    public string ClientFullName { get; set; } = null!;
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int CancelledLessons { get; set; }
    public int BurnedLessons { get; set; }
    public int TotalRemainingSessions { get; set; }
    public int ActivePackageCount { get; set; }
}

public class RevenueReportDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = null!;
    public decimal Revenue { get; set; }
    public int PackagesSold { get; set; }
}

public class CancellationReportDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = null!;
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int CancelledLessons { get; set; }
    public int BurnedLessons { get; set; }
    public double CancellationRate { get; set; }
    public double BurnRate { get; set; }
}
