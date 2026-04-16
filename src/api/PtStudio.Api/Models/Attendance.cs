using PtStudio.Api.Enums;

namespace PtStudio.Api.Models;

public class Attendance
{
    public int Id { get; set; }
    public int AppointmentClientId { get; set; }
    public DateTime CheckInTime { get; set; }
    public AttendanceMethod Method { get; set; }

    public AppointmentClient AppointmentClient { get; set; } = null!;
}
