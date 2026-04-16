namespace PtStudio.Api.DTOs;

public class AppointmentCreateDto
{
    public int TrainerId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Capacity { get; set; } = 1;
    public bool IsGroup { get; set; }
    public string? Notes { get; set; }
    public List<AppointmentClientCreateDto> Clients { get; set; } = new();
}

public class AppointmentClientCreateDto
{
    public int ClientId { get; set; }
    public int ClientPackageId { get; set; }
}
