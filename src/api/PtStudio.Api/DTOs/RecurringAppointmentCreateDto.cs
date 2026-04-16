namespace PtStudio.Api.DTOs;

public class RecurringAppointmentCreateDto
{
    public int TrainerId { get; set; }
    public TimeSpan StartTimeOfDay { get; set; }
    public TimeSpan EndTimeOfDay { get; set; }
    public List<DayOfWeek> Days { get; set; } = new();
    public int Weeks { get; set; }
    public DateTime StartDate { get; set; }
    public int Capacity { get; set; } = 1;
    public bool IsGroup { get; set; }
    public string? Notes { get; set; }
    public List<AppointmentClientCreateDto> Clients { get; set; } = new();
}
