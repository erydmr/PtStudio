using PtStudio.Api.Enums;

namespace PtStudio.Api.Models;

public class AppointmentClient
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public int ClientId { get; set; }
    public int ClientPackageId { get; set; }
    public AppointmentClientStatus Status { get; set; } = AppointmentClientStatus.Scheduled;
    public DateTime? CancelledAt { get; set; }
    public int? CancelledBy { get; set; }

    public Appointment Appointment { get; set; } = null!;
    public Client Client { get; set; } = null!;
    public ClientPackage ClientPackage { get; set; } = null!;
    public Attendance? Attendance { get; set; }
}
