using PtStudio.Api.Enums;

namespace PtStudio.Api.DTOs;

public class AppointmentUpdateDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Capacity { get; set; }
    public bool IsGroup { get; set; }
    public string? Notes { get; set; }
    public AppointmentStatus Status { get; set; }
}
