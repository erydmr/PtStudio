namespace PtStudio.Api.DTOs;

public class AppointmentDto
{
    public int Id { get; set; }
    public int TrainerId { get; set; }
    public string TrainerFullName { get; set; } = null!;
    public string? TrainerColor { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Capacity { get; set; }
    public bool IsGroup { get; set; }
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public Guid? RecurrenceGroupId { get; set; }
    public List<AppointmentClientDto> Clients { get; set; } = new();
}

public class AppointmentClientDto
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public string ClientFullName { get; set; } = null!;
    public int ClientPackageId { get; set; }
    public string Status { get; set; } = null!;
}
