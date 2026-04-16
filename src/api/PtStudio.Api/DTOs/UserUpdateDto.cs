using PtStudio.Api.Enums;

namespace PtStudio.Api.DTOs;

public class UserUpdateDto
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
}
