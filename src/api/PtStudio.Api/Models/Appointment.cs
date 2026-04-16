using PtStudio.Api.Enums;

namespace PtStudio.Api.Models;

public class Appointment
{
    public int Id { get; set; }
    public int TrainerId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Capacity { get; set; } = 1;
    public bool IsGroup { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
    public string? Notes { get; set; }
    public Guid? RecurrenceGroupId { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public ICollection<AppointmentClient> AppointmentClients { get; set; } = new List<AppointmentClient>();
}
