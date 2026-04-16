namespace PtStudio.Api.DTOs;

public class ClientUpdateDto
{
    public string? Notes { get; set; }
    public string? EmergencyContact { get; set; }
    public bool IsActive { get; set; }
}
