namespace PtStudio.Api.DTOs;

public class ClientDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public string? EmergencyContact { get; set; }
    public bool IsActive { get; set; }
}
