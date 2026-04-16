using PtStudio.Api.Enums;

namespace PtStudio.Api.DTOs;

public class RegisterDto
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string Password { get; set; } = null!;
    public UserRole Role { get; set; }
    public string? Specialization { get; set; }
    public string? Color { get; set; }
    public string? Notes { get; set; }
    public string? EmergencyContact { get; set; }
}
