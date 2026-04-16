namespace PtStudio.Api.DTOs;

public class CheckInDto
{
    public string StudioToken { get; set; } = null!;
}

public class CheckInResponseDto
{
    public int AttendanceId { get; set; }
    public string ClientFullName { get; set; } = null!;
    public string TrainerFullName { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Method { get; set; } = null!;
}
